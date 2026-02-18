import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { getSessionOrThrow, requireSession, sessionMiddleware } from "./session";
import type { HttpAppEnv } from "../types";
import { Hono } from "hono";

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

const mockedGetCookie = vi.mocked(getCookie);
const mockedVerify = vi.mocked(verify);

describe("getSessionOrThrow", () => {
  it("returns the session when present", () => {
    const session = { publicKey: "wallet1", organizationId: "org1", role: 1 };
    const c = { var: { session } } as any;

    expect(getSessionOrThrow(c)).toBe(session);
  });

  it("throws HTTPException(401) when session is null", () => {
    const c = { var: { session: null } } as any;

    expect(() => getSessionOrThrow(c)).toThrow(HTTPException);
    try {
      getSessionOrThrow(c);
    } catch (err) {
      expect((err as HTTPException).status).toBe(401);
    }
  });
});

describe("sessionMiddleware + requireSession (integration via Hono)", async () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sessionMiddleware sets session to null when no token", async () => {
    mockedGetCookie.mockReturnValue(undefined);

    const app = new Hono<HttpAppEnv>();
    app.use("*", sessionMiddleware);
    app.get("/test", (c) => {
      const session = c.get("session");
      return c.json({ session });
    });

    const res = await app.request("/test");
    const body = (await res.json()) as any;
    expect(body.session).toBeNull();
  });

  it("sessionMiddleware sets session from valid JWT cookie", async () => {
    mockedGetCookie.mockReturnValue("valid-token");
    mockedVerify.mockResolvedValue({
      sub: "wallet123",
      organizationId: "org-1",
      role: 1,
    });

    const app = new Hono<HttpAppEnv>();
    app.use("*", sessionMiddleware);
    app.get("/test", (c) => {
      const session = c.get("session");
      return c.json({ session });
    });

    const res = await app.request("/test");
    const body = (await res.json()) as any;
    expect(body.session).toEqual({
      publicKey: "wallet123",
      organizationId: "org-1",
      role: 1,
    });
  });

  it("requireSession throws 401 HTTPException when no token", async () => {
    mockedGetCookie.mockReturnValue(undefined);

    const app = new Hono<HttpAppEnv>();
    app.use("*", requireSession);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });

  it("requireSession passes through when session is valid", async () => {
    mockedGetCookie.mockReturnValue("valid-token");
    mockedVerify.mockResolvedValue({
      sub: "wallet",
      organizationId: "org",
      role: 2,
    });

    const app = new Hono<HttpAppEnv>();
    app.use("*", requireSession);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });
});
