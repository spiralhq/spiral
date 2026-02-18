import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { verifyUseCase } from "./verify.use-case";
import { authRepository } from "../repositories/auth.repository";
import { solanaGateway } from "../gateways/solana.gateway";
import { sign } from "hono/jwt";
import { AppError } from "../../../core/errors/app-error";

vi.mock("@spiral/env/server", () => ({
  env: {
    JWT_SECRET: "test-jwt-secret-for-verify-tests",
    NODE_ENV: "test",
    SOLANA_RPC_URL: "https://fake.rpc",
    ORGANIZATION_PROGRAM_ID: "11111111111111111111111111111111",
  },
}));

vi.mock("hono/jwt", () => ({
  sign: vi.fn().mockResolvedValue("mock-jwt-token"),
}));

vi.mock("../repositories/auth.repository", () => ({
  authRepository: {
    findValidChallenge: vi.fn(),
    consumeChallenge: vi.fn(),
    findInviteForVerify: vi.fn(),
    acceptInviteTransaction: vi.fn(),
    findMembershipByUser: vi.fn(),
  },
}));

vi.mock("../gateways/solana.gateway", () => ({
  solanaGateway: {
    resolveMemberPda: vi.fn(),
    memberPdaExists: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(authRepository);
const mockedGateway = vi.mocked(solanaGateway);
const mockedSign = vi.mocked(sign);

const keypair = nacl.sign.keyPair();
const testPublicKey = bs58.encode(keypair.publicKey);

function signMessage(message: string): string {
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  return bs58.encode(signature);
}

describe("verifyUseCase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T12:00:00.000Z"));
    vi.clearAllMocks();
    mockedSign.mockResolvedValue("mock-jwt-token");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("invalid or expired challenge", () => {
    it("throws BAD_REQUEST when no valid challenge found", async () => {
      mockedRepo.findValidChallenge.mockResolvedValue(null);

      try {
        await verifyUseCase({
          publicKey: testPublicKey,
          signature: "fake-sig-12345",
          nonce: "nonexistent-nonce",
        });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe("BAD_REQUEST");
        expect(appErr.i18nKey).toBe("errors.auth.invalid-or-expired-challenge");
      }
    });
  });

  describe("invalid signature", () => {
    it("throws BAD_REQUEST when signature verification fails", async () => {
      const message = `Spiral Auth\nNonce: test-nonce-123\nWallet: ${testPublicKey}`;

      mockedRepo.findValidChallenge.mockResolvedValue({
        id: "ch-1",
        publicKey: testPublicKey,
        nonce: "test-nonce-123",
        message,
        expiresAt: new Date("2025-06-01T12:05:00Z"),
      });

      try {
        await verifyUseCase({
          publicKey: testPublicKey,
          signature: bs58.encode(new Uint8Array(64)),
          nonce: "test-nonce-123",
        });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe("BAD_REQUEST");
        expect(appErr.i18nKey).toBe("errors.auth.invalid-signature");
      }
    });
  });

  describe("replay prevention", () => {
    it("consumes the challenge after successful verification", async () => {
      const message = `Spiral Auth\nNonce: nonce-abc\nWallet: ${testPublicKey}`;
      const signature = signMessage(message);

      mockedRepo.findValidChallenge.mockResolvedValue({
        id: "ch-1",
        publicKey: testPublicKey,
        nonce: "nonce-abc",
        message,
        expiresAt: new Date("2025-06-01T12:05:00Z"),
      });
      mockedRepo.findMembershipByUser.mockResolvedValue({
        organizationId: "org-1",
        role: 2,
        pda: "pda-1",
      });

      await verifyUseCase({
        publicKey: testPublicKey,
        signature,
        nonce: "nonce-abc",
      });

      expect(mockedRepo.consumeChallenge).toHaveBeenCalledWith({ id: "ch-1" });
    });
  });

  describe("invite flow", () => {
    const message = `Spiral Auth\nNonce: nonce-invite\nWallet: ${testPublicKey}`;
    const validChallenge = {
      id: "ch-invite",
      publicKey: testPublicKey,
      nonce: "nonce-invite",
      message,
      expiresAt: new Date("2025-06-01T12:05:00Z"),
    };

    function setupValidSignature() {
      mockedRepo.findValidChallenge.mockResolvedValue(validChallenge);
    }

    function getInput() {
      return {
        publicKey: testPublicKey,
        signature: signMessage(message),
        nonce: "nonce-invite",
        inviteToken: "invite-token-abc",
      };
    }

    it("throws NOT_FOUND when invite is missing", async () => {
      setupValidSignature();
      mockedRepo.findInviteForVerify.mockResolvedValue(null);

      try {
        await verifyUseCase(getInput());
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe("NOT_FOUND");
        expect(appErr.i18nKey).toBe("errors.invite.not-found");
      }
    });

    it("throws CONFLICT when invite is already accepted", async () => {
      setupValidSignature();
      mockedRepo.findInviteForVerify.mockResolvedValue({
        id: "inv-1",
        organizationId: "org-1",
        role: 2,
        status: "accepted",
        organization: { id: "org-1", pda: "org-pda" },
      });

      try {
        await verifyUseCase(getInput());
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe("CONFLICT");
        expect(appErr.i18nKey).toBe("errors.invite.already-accepted");
      }
    });

    it("throws PRECONDITION_FAILED when member PDA does not exist on-chain", async () => {
      setupValidSignature();
      mockedRepo.findInviteForVerify.mockResolvedValue({
        id: "inv-1",
        organizationId: "org-1",
        role: 2,
        status: "pending",
        organization: { id: "org-1", pda: "org-pda" },
      });
      mockedGateway.resolveMemberPda.mockResolvedValue("derived-member-pda");
      mockedGateway.memberPdaExists.mockResolvedValue(false);

      try {
        await verifyUseCase(getInput());
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe("PRECONDITION_FAILED");
        expect(appErr.i18nKey).toBe("errors.auth.member-pda-missing");
        expect(appErr.meta).toEqual({
          memberPda: "derived-member-pda",
          organizationId: "org-1",
        });
      }
    });

    it("calls acceptInviteTransaction with correct payload on success", async () => {
      setupValidSignature();
      mockedRepo.findInviteForVerify.mockResolvedValue({
        id: "inv-1",
        organizationId: "org-1",
        role: 2,
        status: "pending",
        organization: { id: "org-1", pda: "org-pda" },
      });
      mockedGateway.resolveMemberPda.mockResolvedValue("derived-member-pda");
      mockedGateway.memberPdaExists.mockResolvedValue(true);

      const result = await verifyUseCase(getInput());

      expect(mockedRepo.acceptInviteTransaction).toHaveBeenCalledWith({
        publicKey: testPublicKey,
        organizationId: "org-1",
        role: 2,
        pda: "derived-member-pda",
        inviteId: "inv-1",
      });

      expect(result.token).toBe("mock-jwt-token");
    });

    it("resolves member PDA using correct organization PDA and user public key", async () => {
      setupValidSignature();
      mockedRepo.findInviteForVerify.mockResolvedValue({
        id: "inv-2",
        organizationId: "org-2",
        role: 1,
        status: "pending",
        organization: { id: "org-2", pda: "special-org-pda" },
      });
      mockedGateway.resolveMemberPda.mockResolvedValue("pda-result");
      mockedGateway.memberPdaExists.mockResolvedValue(true);

      await verifyUseCase(getInput());

      expect(mockedGateway.resolveMemberPda).toHaveBeenCalledWith({
        organizationPda: "special-org-pda",
        userPublicKey: testPublicKey,
      });
    });
  });

  describe("non-invite flow", () => {
    const message = `Spiral Auth\nNonce: nonce-direct\nWallet: ${testPublicKey}`;
    const validChallenge = {
      id: "ch-direct",
      publicKey: testPublicKey,
      nonce: "nonce-direct",
      message,
      expiresAt: new Date("2025-06-01T12:05:00Z"),
    };

    function setupValidSignature() {
      mockedRepo.findValidChallenge.mockResolvedValue(validChallenge);
    }

    function getInput() {
      return {
        publicKey: testPublicKey,
        signature: signMessage(message),
        nonce: "nonce-direct",
      };
    }

    it("throws NOT_FOUND when user has no membership", async () => {
      setupValidSignature();
      mockedRepo.findMembershipByUser.mockResolvedValue(null);

      try {
        await verifyUseCase(getInput());
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe("NOT_FOUND");
        expect(appErr.i18nKey).toBe("errors.auth.no-org-for-user");
      }
    });

    it("returns JWT token on success", async () => {
      setupValidSignature();
      mockedRepo.findMembershipByUser.mockResolvedValue({
        organizationId: "org-1",
        role: 1,
        pda: "member-pda",
      });

      const result = await verifyUseCase(getInput());

      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.token).toBe("mock-jwt-token");
    });

    it("calls sign() with correct payload", async () => {
      setupValidSignature();
      mockedRepo.findMembershipByUser.mockResolvedValue({
        organizationId: "org-1",
        role: 1,
        pda: "member-pda",
      });

      await verifyUseCase(getInput());

      expect(mockedSign).toHaveBeenCalledWith(
        {
          sub: testPublicKey,
          organizationId: "org-1",
          role: 1,
          exp: Math.floor(new Date("2025-06-01T12:00:00.000Z").getTime() / 1000) + 60 * 60 * 24,
        },
        "test-jwt-secret-for-verify-tests",
      );
    });

    it("uses the membership role and organizationId for JWT", async () => {
      setupValidSignature();
      mockedRepo.findMembershipByUser.mockResolvedValue({
        organizationId: "org-custom",
        role: 3,
        pda: "pda-x",
      });

      await verifyUseCase(getInput());

      expect(mockedSign).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: "org-custom",
          role: 3,
        }),
        expect.any(String),
      );
    });
  });

  describe("invite flow JWT", () => {
    it("signs JWT with invite's organizationId and role", async () => {
      const message = `Spiral Auth\nNonce: nonce-jwt\nWallet: ${testPublicKey}`;
      mockedRepo.findValidChallenge.mockResolvedValue({
        id: "ch-jwt",
        publicKey: testPublicKey,
        nonce: "nonce-jwt",
        message,
        expiresAt: new Date("2025-06-01T12:05:00Z"),
      });
      mockedRepo.findInviteForVerify.mockResolvedValue({
        id: "inv-jwt",
        organizationId: "org-invite",
        role: 5,
        status: "pending",
        organization: { id: "org-invite", pda: "org-pda" },
      });
      mockedGateway.resolveMemberPda.mockResolvedValue("pda-inv");
      mockedGateway.memberPdaExists.mockResolvedValue(true);

      await verifyUseCase({
        publicKey: testPublicKey,
        signature: signMessage(message),
        nonce: "nonce-jwt",
        inviteToken: "token-jwt",
      });

      expect(mockedSign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: testPublicKey,
          organizationId: "org-invite",
          role: 5,
        }),
        expect.any(String),
      );
    });
  });
});
