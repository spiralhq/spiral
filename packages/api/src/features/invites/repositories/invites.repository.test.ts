import { describe, it, expect, vi, beforeEach } from "vitest";
import { invitesRepository } from "./invites.repository";

const { mockInsert, mockQueryOrganizations } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockQueryOrganizations = { findFirst: vi.fn() };
  return { mockInsert, mockQueryOrganizations };
});

vi.mock("@spiral/db", () => ({
  db: {
    insert: mockInsert,
    query: {
      organizations: mockQueryOrganizations,
    },
  },
}));

vi.mock("@spiral/db/schema/auth", () => ({
  invites: {
    id: "id",
    token: "token",
    organizationId: "organizationId",
    role: "role",
    status: "status",
    expiresAt: "expiresAt",
  },
  organizations: {
    id: "id",
    name: "name",
    pda: "pda",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ type: "eq", a, b })),
}));

function resetChainableMocks() {
  mockInsert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "invite-uuid-123" }]),
    }),
  });
}

describe("invitesRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChainableMocks();
  });

  describe("createInvite", () => {
    it("inserts an invite and returns the id", async () => {
      const result = await invitesRepository.createInvite({
        token: "secure-token-abc",
        organizationId: "org-1",
        role: 2,
        expiresAt: new Date("2025-01-08T00:00:00Z"),
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(result).toBe("invite-uuid-123");
    });

    it("inserts with correct values", async () => {
      const expiresAt = new Date("2025-01-08T00:00:00Z");
      await invitesRepository.createInvite({
        token: "my-token",
        organizationId: "org-abc",
        role: 1,
        expiresAt,
      });

      const valuesCall = mockInsert.mock.results[0]!.value.values;
      expect(valuesCall).toHaveBeenCalledWith({
        token: "my-token",
        organizationId: "org-abc",
        role: 1,
        status: "pending",
        expiresAt,
      });
    });
  });

  describe("findOrganizationById", () => {
    it("returns organization when found", async () => {
      const org = { id: "org-1", name: "Test Org", pda: "pda-123" };
      mockQueryOrganizations.findFirst.mockResolvedValue(org);

      const result = await invitesRepository.findOrganizationById({
        organizationId: "org-1",
      });

      expect(result).toEqual(org);
    });

    it("returns null when organization not found", async () => {
      mockQueryOrganizations.findFirst.mockResolvedValue(undefined);

      const result = await invitesRepository.findOrganizationById({
        organizationId: "non-existent",
      });

      expect(result).toBeNull();
    });
  });
});
