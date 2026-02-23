import { describe, it, expect, vi, beforeEach } from "vitest";
import { membersRouter } from "./members.trpc";
import { listMembersUseCase } from "../use-cases/list-members.use-case";
import type { ListMembersOutput } from "../dtos/list-members.dto";

vi.mock("@spiral/env/server", () => ({
  env: {
    JWT_SECRET: "test-secret",
    NODE_ENV: "test",
  },
}));

vi.mock("../use-cases/list-members.use-case", () => ({
  listMembersUseCase: vi.fn(),
}));

const mockedListMembers = vi.mocked(listMembersUseCase);

function createMockResult(
  items: ListMembersOutput["items"],
  overrides: Partial<ListMembersOutput> = {},
): ListMembersOutput {
  return {
    items,
    page: 1,
    pageSize: 20,
    total: items.length,
    totalPages: Math.ceil(items.length / 20) || 0,
    sortBy: "createdAt",
    sortDir: "desc",
    q: null,
    filters: null,
    ...overrides,
  };
}

describe("membersRouter (tRPC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("members.list", () => {
    it("throws UNAUTHORIZED when session is null", async () => {
      const caller = membersRouter.createCaller({ session: null, hono: {} as any });

      try {
        await caller.list({});
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("UNAUTHORIZED");
      }
    });

    it("returns paginated members list when authenticated", async () => {
      mockedListMembers.mockResolvedValue(
        createMockResult([
          {
            userPublicKey: "wallet1",
            name: "Alice",
            role: 1,
            pda: "pda1",
          },
        ]),
      );

      const caller = membersRouter.createCaller({
        session: { publicKey: "wallet123", organizationId: "org-1", role: 1 },
        hono: {} as any,
      });

      const result = await caller.list({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe("Alice");
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it("calls use case with organizationId from session", async () => {
      mockedListMembers.mockResolvedValue(createMockResult([]));

      const caller = membersRouter.createCaller({
        session: { publicKey: "wallet", organizationId: "session-org-id", role: 2 },
        hono: {} as any,
      });

      await caller.list({});

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: "session-org-id",
        }),
      );
    });

    it("passes pagination params to use case", async () => {
      mockedListMembers.mockResolvedValue(
        createMockResult([], { page: 2, pageSize: 10 }),
      );

      const caller = membersRouter.createCaller({
        session: { publicKey: "wallet", organizationId: "org-1", role: 1 },
        hono: {} as any,
      });

      await caller.list({ page: 2, pageSize: 10 });

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        }),
      );
    });

    it("passes sort params to use case", async () => {
      mockedListMembers.mockResolvedValue(
        createMockResult([], { sortBy: "name", sortDir: "asc" }),
      );

      const caller = membersRouter.createCaller({
        session: { publicKey: "wallet", organizationId: "org-1", role: 1 },
        hono: {} as any,
      });

      await caller.list({ sortBy: "name", sortDir: "asc" });

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "name",
          sortDir: "asc",
        }),
      );
    });

    it("passes search param to use case", async () => {
      mockedListMembers.mockResolvedValue(createMockResult([], { q: "alice" }));

      const caller = membersRouter.createCaller({
        session: { publicKey: "wallet", organizationId: "org-1", role: 1 },
        hono: {} as any,
      });

      await caller.list({ q: "alice" });

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "alice",
        }),
      );
    });

    it("passes filters to use case", async () => {
      mockedListMembers.mockResolvedValue(
        createMockResult([], { filters: { role: 1, hasPda: true } }),
      );

      const caller = membersRouter.createCaller({
        session: { publicKey: "wallet", organizationId: "org-1", role: 1 },
        hono: {} as any,
      });

      await caller.list({ filters: { role: 1, hasPda: true } });

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { role: 1, hasPda: true },
        }),
      );
    });
  });
});
