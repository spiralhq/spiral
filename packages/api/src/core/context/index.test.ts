import { describe, it, expect, vi, beforeEach } from "vitest";
import { createContext } from "./index";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import type { Context as HonoContext } from "hono";

vi.mock("@spiral/env/server", () => ({
  env: {
    JWT_SECRET: "test-secret-key-for-testing",
    NODE_ENV: "test",
  },
}));

vi.mock("hono/cookie", () => ({
  getCookie: vi.fn(),
}));

vi.mock("hono/jwt", () => ({
  verify: vi.fn(),
}));

function makeMockHonoContext(overrides?: { cookie?: string; authHeader?: string }): HonoContext {
  return {
    req: {
      header: vi.fn((name: string) => {
        if (name === "Authorization" && overrides?.authHeader) {
          return overrides.authHeader;
        }
        return undefined;
      }),
    },
  } as unknown as HonoContext;
}

const mockedGetCookie = vi.mocked(getCookie);
const mockedVerify = vi.mocked(verify);

describe("createContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session: null when no token is present", async () => {
    const hono = makeMockHonoContext();
    mockedGetCookie.mockReturnValue(undefined);

    const ctx = await createContext({ context: hono });

    expect(ctx.session).toBeNull();
    expect(ctx.hono).toBe(hono);
  });

  it("extracts token from session cookie", async () => {
    const hono = makeMockHonoContext();
    mockedGetCookie.mockReturnValue("cookie-jwt-token");
    mockedVerify.mockResolvedValue({
      sub: "wallet123",
      organizationId: "org-1",
      role: 1,
    });

    const ctx = await createContext({ context: hono });

    expect(mockedVerify).toHaveBeenCalledWith(
      "cookie-jwt-token",
      "test-secret-key-for-testing",
      "HS256",
    );
    expect(ctx.session).toEqual({
      publicKey: "wallet123",
      organizationId: "org-1",
      role: 1,
    });
  });

  it("extracts token from Authorization header when no cookie", async () => {
    const hono = makeMockHonoContext({ authHeader: "Bearer header-jwt-token" });
    mockedGetCookie.mockReturnValue(undefined);
    mockedVerify.mockResolvedValue({
      sub: "wallet456",
      organizationId: "org-2",
      role: 2,
    });

    const ctx = await createContext({ context: hono });

    expect(mockedVerify).toHaveBeenCalledWith(
      "header-jwt-token",
      "test-secret-key-for-testing",
      "HS256",
    );
    expect(ctx.session).toEqual({
      publicKey: "wallet456",
      organizationId: "org-2",
      role: 2,
    });
  });

  it("prefers cookie over Authorization header", async () => {
    const hono = makeMockHonoContext({ authHeader: "Bearer header-token" });
    mockedGetCookie.mockReturnValue("cookie-token");
    mockedVerify.mockResolvedValue({
      sub: "wallet-cookie",
      organizationId: "org-cookie",
      role: 0,
    });

    const ctx = await createContext({ context: hono });

    expect(mockedVerify).toHaveBeenCalledWith("cookie-token", expect.any(String), "HS256");
    expect(ctx.session!.publicKey).toBe("wallet-cookie");
  });

  it("returns session: null when JWT verification fails", async () => {
    const hono = makeMockHonoContext();
    mockedGetCookie.mockReturnValue("bad-token");
    mockedVerify.mockRejectedValue(new Error("Invalid token"));

    const ctx = await createContext({ context: hono });

    expect(ctx.session).toBeNull();
    expect(ctx.hono).toBe(hono);
  });
});
