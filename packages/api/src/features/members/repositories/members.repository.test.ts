import { describe, it, expect, vi, beforeEach } from "vitest";
import { membersRepository } from "./members.repository";

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
    pda: "pda",
    createdAt: "createdAt",
  },
  users: {
    publicKey: "publicKey",
    name: "name",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ type: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  or: vi.fn((...args: unknown[]) => ({ type: "or", args })),
  ilike: vi.fn((a: unknown, b: unknown) => ({ type: "ilike", a, b })),
  isNotNull: vi.fn((a: unknown) => ({ type: "isNotNull", a })),
  isNull: vi.fn((a: unknown) => ({ type: "isNull", a })),
  sql: vi.fn((strings: TemplateStringsArray) => strings.join("")),
  asc: vi.fn((a: unknown) => ({ type: "asc", a })),
  desc: vi.fn((a: unknown) => ({ type: "desc", a })),
}));

function createQuerySelectChain(countResult: { count: number }, rows: unknown[]) {
  let callCount = 0;
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call is count query
            return Promise.resolve([countResult]);
          }
          // Second call is items query with orderBy, limit, offset
          return {
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(rows),
              }),
            }),
          };
        }),
      }),
    }),
  };
}

describe("membersRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listWithQuery", () => {
    it("returns paginated results with total count", async () => {
      const members = [
        { userPublicKey: "wallet1", name: "Alice", role: 1, pda: "pda1", createdAt: new Date() },
      ];
      mockSelect.mockReturnValue(createQuerySelectChain({ count: 5 }, members));

      const result = await membersRepository.listWithQuery({
        organizationId: "org-1",
        offset: 0,
        limit: 20,
        sortBy: null,
        sortDir: "asc",
        q: null,
        filters: null,
      });

      expect(result.items).toEqual(members);
      expect(result.total).toBe(5);
    });

    it("returns empty results when no members", async () => {
      mockSelect.mockReturnValue(createQuerySelectChain({ count: 0 }, []));

      const result = await membersRepository.listWithQuery({
        organizationId: "empty-org",
        offset: 0,
        limit: 20,
        sortBy: null,
        sortDir: "asc",
        q: null,
        filters: null,
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("applies search filter", async () => {
      const members = [
        { userPublicKey: "wallet1", name: "Alice", role: 1, pda: "pda1", createdAt: new Date() },
      ];
      mockSelect.mockReturnValue(createQuerySelectChain({ count: 1 }, members));

      const result = await membersRepository.listWithQuery({
        organizationId: "org-1",
        offset: 0,
        limit: 20,
        sortBy: null,
        sortDir: "asc",
        q: "alice",
        filters: null,
      });

      expect(result.items).toHaveLength(1);
    });

    it("applies role filter", async () => {
      const members = [
        { userPublicKey: "wallet1", name: "Admin", role: 1, pda: "pda1", createdAt: new Date() },
      ];
      mockSelect.mockReturnValue(createQuerySelectChain({ count: 1 }, members));

      const result = await membersRepository.listWithQuery({
        organizationId: "org-1",
        offset: 0,
        limit: 20,
        sortBy: null,
        sortDir: "asc",
        q: null,
        filters: { role: 1 },
      });

      expect(result.items).toHaveLength(1);
    });

    it("applies hasPda filter", async () => {
      const members = [
        { userPublicKey: "wallet1", name: "User", role: 2, pda: "pda1", createdAt: new Date() },
      ];
      mockSelect.mockReturnValue(createQuerySelectChain({ count: 1 }, members));

      const result = await membersRepository.listWithQuery({
        organizationId: "org-1",
        offset: 0,
        limit: 20,
        sortBy: null,
        sortDir: "asc",
        q: null,
        filters: { hasPda: true },
      });

      expect(result.items).toHaveLength(1);
    });

    it("applies sorting", async () => {
      const members = [
        { userPublicKey: "wallet1", name: "Alice", role: 1, pda: "pda1", createdAt: new Date() },
        { userPublicKey: "wallet2", name: "Bob", role: 2, pda: "pda2", createdAt: new Date() },
      ];
      mockSelect.mockReturnValue(createQuerySelectChain({ count: 2 }, members));

      const result = await membersRepository.listWithQuery({
        organizationId: "org-1",
        offset: 0,
        limit: 20,
        sortBy: "name",
        sortDir: "desc",
        q: null,
        filters: null,
      });

      expect(result.items).toHaveLength(2);
    });

    it("applies offset and limit", async () => {
      const members = [
        { userPublicKey: "wallet3", name: "Charlie", role: 2, pda: "pda3", createdAt: new Date() },
      ];
      mockSelect.mockReturnValue(createQuerySelectChain({ count: 50 }, members));

      const result = await membersRepository.listWithQuery({
        organizationId: "org-1",
        offset: 20,
        limit: 10,
        sortBy: null,
        sortDir: "asc",
        q: null,
        filters: null,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(50);
    });
  });
});
