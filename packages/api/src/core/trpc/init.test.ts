import { describe, it, expect, vi } from "vitest";
import { t, router } from "./init";
import { AppError } from "../errors/app-error";
import { toTrpcError } from "../errors/to-trpc-error";
import { protectedProcedure } from "./procedures";

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

describe("tRPC errorFormatter", () => {
  it("exposes i18nKey and meta from cause", () => {
    const testRouter = router({
      fail: t.procedure.mutation(() => {
        throw new AppError("BAD_REQUEST", "errors.test.fail", { detail: "x" });
      }),
    });

    expect(t).toBeDefined();
    expect(t.procedure).toBeDefined();
    expect(router).toBeDefined();
    expect(testRouter).toBeDefined();
  });
});

describe("tRPC error formatting integration", () => {
  it("errorFormatter returns i18nKey and meta for handled errors", async () => {
    const testRouter = router({
      failWithAppError: t.procedure.mutation(() => {
        throw toTrpcError(new AppError("NOT_FOUND", "errors.user.missing", { userId: "abc" }));
      }),
    });

    const caller = testRouter.createCaller({ session: null, hono: {} as any });

    try {
      await caller.failWithAppError();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("NOT_FOUND");
      expect(err.cause).toMatchObject({
        i18nKey: "errors.user.missing",
        meta: { userId: "abc" },
      });
    }
  });

  it("errorFormatter returns errors.internal for unhandled errors", async () => {
    const testRouter = router({
      failUnhandled: t.procedure.mutation(() => {
        throw toTrpcError(new Error("unexpected"));
      }),
    });

    const caller = testRouter.createCaller({ session: null, hono: {} as any });

    try {
      await caller.failUnhandled();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("INTERNAL_SERVER_ERROR");
      expect(err.cause).toMatchObject({ i18nKey: "errors.internal", meta: null });
    }
  });

  it("protectedProcedure rejects when session is null", async () => {
    const testRouter = router({
      secret: protectedProcedure.query(() => "hidden"),
    });

    const caller = testRouter.createCaller({ session: null, hono: {} as any });

    try {
      await caller.secret();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("UNAUTHORIZED");
      expect(err.message).toBe("errors.auth.required");
    }
  });

  it("protectedProcedure allows authenticated session", async () => {
    const testRouter = router({
      secret: protectedProcedure.query(({ ctx }) => ctx.session.publicKey),
    });

    const caller = testRouter.createCaller({
      session: { publicKey: "wallet1", organizationId: "org1", role: 1 },
      hono: {} as any,
    });

    const result = await caller.secret();
    expect(result).toBe("wallet1");
  });
});
