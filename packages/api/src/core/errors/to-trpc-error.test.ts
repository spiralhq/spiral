import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { toTrpcError } from "./to-trpc-error";
import { AppError } from "./app-error";
import type { AppErrorCode } from "./app-error";

describe("toTrpcError", () => {
  describe("AppError mapping", () => {
    const mappings: [AppErrorCode, TRPCError["code"]][] = [
      ["UNAUTHORIZED", "UNAUTHORIZED"],
      ["FORBIDDEN", "FORBIDDEN"],
      ["NOT_FOUND", "NOT_FOUND"],
      ["CONFLICT", "CONFLICT"],
      ["BAD_REQUEST", "BAD_REQUEST"],
      ["PRECONDITION_FAILED", "PRECONDITION_FAILED"],
      ["INTERNAL", "INTERNAL_SERVER_ERROR"],
    ];

    it.each(mappings)("maps AppError(%s) -> TRPCError(%s)", (appCode, trpcCode) => {
      const appErr = new AppError(appCode, `errors.${appCode.toLowerCase()}`, { key: "val" });
      const trpcErr = toTrpcError(appErr);

      expect(trpcErr).toBeInstanceOf(TRPCError);
      expect(trpcErr.code).toBe(trpcCode);
      expect(trpcErr.message).toBe("Handled error");
      expect((trpcErr.cause as any).i18nKey).toBe(`errors.${appCode.toLowerCase()}`);
      expect((trpcErr.cause as any).meta).toEqual({ key: "val" });
    });

    it("sets meta to null when AppError has no meta", () => {
      const appErr = new AppError("BAD_REQUEST", "errors.test");
      const trpcErr = toTrpcError(appErr);

      expect((trpcErr.cause as any).meta).toBeNull();
    });
  });

  describe("TRPCError passthrough", () => {
    it("returns the same TRPCError if already a TRPCError", () => {
      const original = new TRPCError({ code: "NOT_FOUND", message: "test" });
      const result = toTrpcError(original);

      expect(result).toBe(original);
    });
  });

  describe("unknown error fallback", () => {
    it("converts a plain Error to INTERNAL_SERVER_ERROR", () => {
      const err = new Error("something broke");
      const trpcErr = toTrpcError(err);

      expect(trpcErr).toBeInstanceOf(TRPCError);
      expect(trpcErr.code).toBe("INTERNAL_SERVER_ERROR");
      expect(trpcErr.message).toBe("Unhandled error");
      expect((trpcErr.cause as any).i18nKey).toBe("errors.internal");
      expect((trpcErr.cause as any).meta).toBeNull();
    });

    it("converts a string throw to INTERNAL_SERVER_ERROR", () => {
      const trpcErr = toTrpcError("unexpected");

      expect(trpcErr.code).toBe("INTERNAL_SERVER_ERROR");
      expect((trpcErr.cause as any).i18nKey).toBe("errors.internal");
    });

    it("converts null/undefined to INTERNAL_SERVER_ERROR", () => {
      expect(toTrpcError(null).code).toBe("INTERNAL_SERVER_ERROR");
      expect(toTrpcError(undefined).code).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});
