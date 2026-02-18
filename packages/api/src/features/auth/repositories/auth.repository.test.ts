import { describe, it, expect, vi, beforeEach } from "vitest";
import { authRepository } from "./auth.repository";
import type {
  CreateChallengeInput,
  FindValidChallengeInput,
  ConsumeChallengeInput,
  UpsertUserInput,
  CreateMembershipInput,
  AcceptInviteInput,
  AcceptInviteTransactionInput,
} from "./auth.repository.types";

const {
  mockInsert,
  mockDelete,
  mockUpdate,
  mockSelect,
  mockTransaction,
  mockQueryChallenges,
  mockQueryMembers,
  mockQueryUsers,
} = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockUpdate = vi.fn();
  const mockSelect = vi.fn();
  const mockTransaction = vi.fn();
  const mockQueryChallenges = { findFirst: vi.fn() };
  const mockQueryMembers = { findFirst: vi.fn() };
  const mockQueryUsers = { findFirst: vi.fn() };

  return {
    mockInsert,
    mockDelete,
    mockUpdate,
    mockSelect,
    mockTransaction,
    mockQueryChallenges,
    mockQueryMembers,
    mockQueryUsers,
  };
});

vi.mock("@spiral/db", () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
    select: mockSelect,
    transaction: mockTransaction,
    query: {
      challenges: mockQueryChallenges,
      members: mockQueryMembers,
      users: mockQueryUsers,
    },
  },
}));

vi.mock("@spiral/db/schema/auth", () => ({
  challenges: { publicKey: "publicKey", nonce: "nonce", expiresAt: "expiresAt", id: "id" },
  invites: {
    id: "id",
    token: "token",
    organizationId: "organizationId",
    role: "role",
    status: "status",
  },
  members: {
    userPublicKey: "userPublicKey",
    organizationId: "organizationId",
    role: "role",
    pda: "pda",
  },
  organizations: { id: "id", pda: "pda" },
  users: { publicKey: "publicKey" },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  eq: vi.fn((a: unknown, b: unknown) => ({ type: "eq", a, b })),
  gt: vi.fn((a: unknown, b: unknown) => ({ type: "gt", a, b })),
}));

function resetChainableMocks() {
  const valuesReturn = { onConflictDoNothing: vi.fn() };
  mockInsert.mockReturnValue({ values: vi.fn().mockReturnValue(valuesReturn) });
  mockDelete.mockReturnValue({ where: vi.fn() });
  mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) });
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  });
}

describe("authRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChainableMocks();
  });

  describe("createChallenge", () => {
    it("inserts a challenge with correct input", async () => {
      const input: CreateChallengeInput = {
        publicKey: "wallet123",
        nonce: "nonce-abc",
        message: "Spiral Auth\nNonce: nonce-abc\nWallet: wallet123",
        expiresAt: new Date("2025-01-01T00:05:00Z"),
      };

      await authRepository.createChallenge(input);

      expect(mockInsert).toHaveBeenCalled();
      const valuesCall = mockInsert.mock.results[0]!.value.values;
      expect(valuesCall).toHaveBeenCalledWith(input);
    });
  });

  describe("findValidChallenge", () => {
    it("queries with publicKey, nonce, and expiration check", async () => {
      const input: FindValidChallengeInput = {
        publicKey: "wallet123",
        nonce: "nonce-abc",
        now: new Date("2025-01-01T00:00:00Z"),
      };

      mockQueryChallenges.findFirst.mockResolvedValue({
        id: "ch-1",
        publicKey: "wallet123",
        nonce: "nonce-abc",
        message: "test message",
        expiresAt: new Date("2025-01-01T00:05:00Z"),
      });

      const result = await authRepository.findValidChallenge(input);

      expect(mockQueryChallenges.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
      });
      expect(result).toEqual({
        id: "ch-1",
        publicKey: "wallet123",
        nonce: "nonce-abc",
        message: "test message",
        expiresAt: new Date("2025-01-01T00:05:00Z"),
      });
    });

    it("returns null when no valid challenge found", async () => {
      mockQueryChallenges.findFirst.mockResolvedValue(undefined);

      const result = await authRepository.findValidChallenge({
        publicKey: "wallet",
        nonce: "nonce",
        now: new Date(),
      });

      expect(result).toBeNull();
    });
  });

  describe("consumeChallenge", () => {
    it("deletes the challenge by id", async () => {
      const input: ConsumeChallengeInput = { id: "ch-1" };
      await authRepository.consumeChallenge(input);

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("findInviteForVerify", () => {
    it("returns null when no invite found", async () => {
      const result = await authRepository.findInviteForVerify({ token: "bad-token" });
      expect(result).toBeNull();
    });

    it("returns invite projection when found", async () => {
      const row = {
        inviteId: "inv-1",
        organizationId: "org-1",
        role: 2,
        status: "pending" as const,
        organization: { id: "org-1", pda: "pda-abc" },
      };

      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([row]),
            }),
          }),
        }),
      });

      const result = await authRepository.findInviteForVerify({ token: "valid-token" });

      expect(result).toEqual({
        id: "inv-1",
        organizationId: "org-1",
        role: 2,
        status: "pending",
        organization: { id: "org-1", pda: "pda-abc" },
      });
    });
  });

  describe("upsertUser", () => {
    it("inserts user with onConflictDoNothing (default db session)", async () => {
      const input: UpsertUserInput = { publicKey: "wallet123" };
      await authRepository.upsertUser(input);

      expect(mockInsert).toHaveBeenCalled();
    });

    it("uses provided session instead of default db", async () => {
      const mockSession = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn() }),
        }),
      };

      const input: UpsertUserInput = { publicKey: "wallet456" };
      await authRepository.upsertUser(input, mockSession as any);

      expect(mockSession.insert).toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe("createMembership", () => {
    it("inserts a membership", async () => {
      const input: CreateMembershipInput = {
        userPublicKey: "wallet123",
        organizationId: "org-1",
        role: 2,
        pda: "member-pda",
      };

      await authRepository.createMembership(input);
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("acceptInvite", () => {
    it("updates invite status to accepted", async () => {
      const input: AcceptInviteInput = { inviteId: "inv-1" };
      await authRepository.acceptInvite(input);

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("findMembershipByUser", () => {
    it("returns membership projection when found", async () => {
      const membership = { organizationId: "org-1", role: 1, pda: "member-pda" };
      mockQueryMembers.findFirst.mockResolvedValue(membership);

      const result = await authRepository.findMembershipByUser({ publicKey: "wallet123" });
      expect(result).toEqual(membership);
    });

    it("returns null when no membership", async () => {
      mockQueryMembers.findFirst.mockResolvedValue(undefined);

      const result = await authRepository.findMembershipByUser({ publicKey: "wallet123" });
      expect(result).toBeNull();
    });
  });

  describe("findMe", () => {
    it("returns MeProjection when user found", async () => {
      mockQueryUsers.findFirst.mockResolvedValue({
        publicKey: "wallet123",
        name: "Alice",
        memberships: [
          {
            organization: { id: "org-1", name: "Test Org" },
            role: 1,
          },
        ],
      });

      const result = await authRepository.findMe({
        publicKey: "wallet123",
        organizationId: "org-1",
      });
      expect(result).toEqual({
        publicKey: "wallet123",
        name: "Alice",
        organization: { id: "org-1", name: "Test Org" },
        role: 1,
      });
    });

    it("returns null when user not found", async () => {
      mockQueryUsers.findFirst.mockResolvedValue(undefined);

      const result = await authRepository.findMe({
        publicKey: "wallet123",
        organizationId: "org-1",
      });
      expect(result).toBeNull();
    });

    it("returns null organization/role when no memberships", async () => {
      mockQueryUsers.findFirst.mockResolvedValue({
        publicKey: "wallet123",
        name: null,
        memberships: [],
      });

      const result = await authRepository.findMe({
        publicKey: "wallet123",
        organizationId: "org-1",
      });
      expect(result).toEqual({
        publicKey: "wallet123",
        name: null,
        organization: null,
        role: null,
      });
    });
  });

  describe("acceptInviteTransaction", () => {
    it("runs upsertUser, createMembership, and acceptInvite in a transaction", async () => {
      const mockTx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn() }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({ where: vi.fn() }),
        }),
      };

      mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        await fn(mockTx);
      });

      const input: AcceptInviteTransactionInput = {
        publicKey: "wallet123",
        organizationId: "org-1",
        role: 2,
        pda: "member-pda",
        inviteId: "inv-1",
      };

      await authRepository.acceptInviteTransaction(input);

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalled();
    });
  });
});
