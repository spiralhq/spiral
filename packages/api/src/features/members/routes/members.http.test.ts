import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { membersHttp } from "./members.http";
import { listMembersUseCase } from "../use-cases/list-members.use-case";
import type { ListMembersOutput } from "../dtos/list-members.dto";

vi.mock("@spiral/env/server", () => ({
  env: {
    JWT_SECRET: "test-secret",
    NODE_ENV: "test",
  },
}));

vi.mock("hono/cookie", () => ({
  getCookie: vi.fn(),
}));

vi.mock("hono/jwt", () => ({
  verify: vi.fn(),
}));

vi.mock("../use-cases/list-members.use-case", () => ({
  listMembersUseCase: vi.fn(),
}));

const mockedGetCookie = vi.mocked(getCookie);
const mockedVerify = vi.mocked(verify);
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

describe("membersHttp routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns 401 when not authenticated", async () => {
      mockedGetCookie.mockReturnValue(undefined);

      const res = await membersHttp.request("/");
      expect(res.status).toBe(401);
    });

    it("returns paginated members list when authenticated", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });
      mockedListMembers.mockResolvedValue(
        createMockResult([
          {
            userPublicKey: "wallet1",
            name: "Alice",
            role: 1,
            pda: "pda1",
          },
          {
            userPublicKey: "wallet2",
            name: null,
            role: 2,
            pda: null,
          },
        ]),
      );

      const res = await membersHttp.request("/");
      expect(res.status).toBe(200);

      const body = (await res.json()) as ListMembersOutput;
      expect(body.items).toHaveLength(2);
      expect(body.items[0]?.name).toBe("Alice");
      expect(body.items[1]?.name).toBeNull();
      expect(body.page).toBe(1);
      expect(body.pageSize).toBe(20);
    });

    it("calls use case with correct organizationId from session", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "my-org-id",
        role: 2,
      });
      mockedListMembers.mockResolvedValue(createMockResult([]));

      await membersHttp.request("/");

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: "my-org-id",
        }),
      );
    });

    it("parses pagination query params", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });
      mockedListMembers.mockResolvedValue(
        createMockResult([], { page: 2, pageSize: 10 }),
      );

      await membersHttp.request("/?page=2&pageSize=10");

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        }),
      );
    });

    it("parses sort query params", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });
      mockedListMembers.mockResolvedValue(
        createMockResult([], { sortBy: "name", sortDir: "asc" }),
      );

      await membersHttp.request("/?sortBy=name&sortDir=asc");

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "name",
          sortDir: "asc",
        }),
      );
    });

    it("parses search query param", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });
      mockedListMembers.mockResolvedValue(
        createMockResult([], { q: "alice" }),
      );

      await membersHttp.request("/?q=alice");

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "alice",
        }),
      );
    });

    it("parses filters query param", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });
      mockedListMembers.mockResolvedValue(
        createMockResult([], { filters: { role: 1 } }),
      );

      await membersHttp.request("/?filters=" + encodeURIComponent('{"role":1}'));

      expect(mockedListMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { role: 1 },
        }),
      );
    });
  });
});
