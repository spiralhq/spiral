import { describe, it, expect, vi, beforeEach } from "vitest";
import { orgsRepository } from "./orgs.repository";

const { mockSelect } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  return { mockSelect };
});

vi.mock("@spiral/db", () => ({
  db: {
    select: mockSelect,
  },
}));

vi.mock("@spiral/db/schema/auth", () => ({
  members: {
    userPublicKey: "userPublicKey",
    organizationId: "organizationId",
    role: "role",
  },
  organizations: {
    id: "id",
    name: "name",
    slug: "slug",
    pda: "pda",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ type: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
}));

function createSelectChain(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(rows),
        }),
      }),
    }),
  };
}

function createSelectChainWithoutLimit(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(rows),
      }),
    }),
  };
}

describe("orgsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findOrganizationsByUser", () => {
    it("returns organizations for user with roles", async () => {
      const organizations = [
        { id: "org-1", name: "Org 1", slug: "org-1", pda: "pda-1", role: 1 },
        { id: "org-2", name: "Org 2", slug: "org-2", pda: "pda-2", role: 2 },
      ];
      mockSelect.mockReturnValue(createSelectChainWithoutLimit(organizations));

      const result = await orgsRepository.findOrganizationsByUser({
        userPublicKey: "wallet123",
      });

      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual(organizations);
    });

    it("returns empty array when user has no organizations", async () => {
      mockSelect.mockReturnValue(createSelectChainWithoutLimit([]));

      const result = await orgsRepository.findOrganizationsByUser({
        userPublicKey: "wallet-no-orgs",
      });

      expect(result).toEqual([]);
    });
  });

  describe("findMembershipForSwitch", () => {
    it("returns membership projection when found", async () => {
      const membership = {
        organizationId: "org-1",
        role: 1,
        organization: { id: "org-1", pda: "pda-1" },
      };
      mockSelect.mockReturnValue(createSelectChain([membership]));

      const result = await orgsRepository.findMembershipForSwitch({
        userPublicKey: "wallet123",
        organizationId: "org-1",
      });

      expect(result).toEqual(membership);
    });

    it("returns null when membership not found", async () => {
      mockSelect.mockReturnValue(createSelectChain([]));

      const result = await orgsRepository.findMembershipForSwitch({
        userPublicKey: "wallet123",
        organizationId: "org-not-member",
      });

      expect(result).toBeNull();
    });
  });
});
