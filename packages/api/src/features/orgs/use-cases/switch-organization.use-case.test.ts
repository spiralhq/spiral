import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { switchOrganizationUseCase } from "./switch-organization.use-case";
import { orgsRepository } from "../repositories/orgs.repository";
import { solanaGateway } from "../../auth/gateways/solana.gateway";
import { sign } from "hono/jwt";
import { AppError } from "../../../core/errors/app-error";

vi.mock("@spiral/env/server", () => ({
  env: {
    JWT_SECRET: "test-jwt-secret",
    NODE_ENV: "test",
    SOLANA_RPC_URL: "https://fake.rpc",
    ORGANIZATION_PROGRAM_ID: "11111111111111111111111111111111",
  },
}));

vi.mock("hono/jwt", () => ({
  sign: vi.fn().mockResolvedValue("mock-jwt-token"),
}));

vi.mock("../repositories/orgs.repository", () => ({
  orgsRepository: {
    findMembershipForSwitch: vi.fn(),
  },
}));

vi.mock("../../auth/gateways/solana.gateway", () => ({
  solanaGateway: {
    resolveMemberPda: vi.fn(),
    memberPdaExists: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(orgsRepository);
const mockedGateway = vi.mocked(solanaGateway);
const mockedSign = vi.mocked(sign);

describe("switchOrganizationUseCase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T12:00:00.000Z"));
    vi.clearAllMocks();
    mockedSign.mockResolvedValue("mock-jwt-token");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws FORBIDDEN when user is not a member", async () => {
    mockedRepo.findMembershipForSwitch.mockResolvedValue(null);

    try {
      await switchOrganizationUseCase({
        publicKey: "wallet123",
        organizationId: "org-not-member",
      });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.code).toBe("FORBIDDEN");
      expect(appErr.i18nKey).toBe("errors.orgs.not-a-member");
    }
  });

  it("throws PRECONDITION_FAILED when member PDA does not exist on-chain", async () => {
    mockedRepo.findMembershipForSwitch.mockResolvedValue({
      organizationId: "org-1",
      role: 2,
      organization: { id: "org-1", pda: "org-pda" },
    });
    mockedGateway.resolveMemberPda.mockResolvedValue("member-pda");
    mockedGateway.memberPdaExists.mockResolvedValue(false);

    try {
      await switchOrganizationUseCase({
        publicKey: "wallet123",
        organizationId: "org-1",
      });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.code).toBe("PRECONDITION_FAILED");
      expect(appErr.i18nKey).toBe("errors.orgs.member-pda-missing");
      expect(appErr.meta).toEqual({
        memberPda: "member-pda",
        organizationId: "org-1",
      });
    }
  });

  it("returns token when switch is successful", async () => {
    mockedRepo.findMembershipForSwitch.mockResolvedValue({
      organizationId: "org-1",
      role: 1,
      organization: { id: "org-1", pda: "org-pda" },
    });
    mockedGateway.resolveMemberPda.mockResolvedValue("member-pda");
    mockedGateway.memberPdaExists.mockResolvedValue(true);

    const result = await switchOrganizationUseCase({
      publicKey: "wallet123",
      organizationId: "org-1",
    });

    expect(result.token).toBe("mock-jwt-token");
  });

  it("calls sign() with correct payload", async () => {
    mockedRepo.findMembershipForSwitch.mockResolvedValue({
      organizationId: "org-1",
      role: 1,
      organization: { id: "org-1", pda: "org-pda" },
    });
    mockedGateway.resolveMemberPda.mockResolvedValue("member-pda");
    mockedGateway.memberPdaExists.mockResolvedValue(true);

    await switchOrganizationUseCase({
      publicKey: "wallet123",
      organizationId: "org-1",
    });

    expect(mockedSign).toHaveBeenCalledWith(
      {
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
        exp: Math.floor(new Date("2025-06-01T12:00:00.000Z").getTime() / 1000) + 60 * 60 * 24,
      },
      "test-jwt-secret",
    );
  });

  it("resolves member PDA with correct parameters", async () => {
    mockedRepo.findMembershipForSwitch.mockResolvedValue({
      organizationId: "org-1",
      role: 2,
      organization: { id: "org-1", pda: "special-org-pda" },
    });
    mockedGateway.resolveMemberPda.mockResolvedValue("member-pda");
    mockedGateway.memberPdaExists.mockResolvedValue(true);

    await switchOrganizationUseCase({
      publicKey: "my-wallet",
      organizationId: "org-1",
    });

    expect(mockedGateway.resolveMemberPda).toHaveBeenCalledWith({
      organizationPda: "special-org-pda",
      userPublicKey: "my-wallet",
    });
  });

  it("uses membership role in JWT", async () => {
    mockedRepo.findMembershipForSwitch.mockResolvedValue({
      organizationId: "org-1",
      role: 3,
      organization: { id: "org-1", pda: "org-pda" },
    });
    mockedGateway.resolveMemberPda.mockResolvedValue("member-pda");
    mockedGateway.memberPdaExists.mockResolvedValue(true);

    await switchOrganizationUseCase({
      publicKey: "wallet123",
      organizationId: "org-1",
    });

    expect(mockedSign).toHaveBeenCalledWith(
      expect.objectContaining({ role: 3 }),
      expect.any(String),
    );
  });
});
