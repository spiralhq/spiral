import { describe, it, expect } from "vitest";
import { AppError } from "./app-error";
import type { AppErrorCode } from "./app-error";

describe("AppError", () => {
  it("is an instance of Error", () => {
    const err = new AppError("BAD_REQUEST", "errors.test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it("stores code, i18nKey, and meta", () => {
    const meta = { field: "email" };
    const err = new AppError("NOT_FOUND", "errors.user.not-found", meta);

    expect(err.code).toBe("NOT_FOUND");
    expect(err.i18nKey).toBe("errors.user.not-found");
    expect(err.meta).toEqual({ field: "email" });
  });

  it("uses i18nKey as the message", () => {
    const err = new AppError("INTERNAL", "errors.internal");
    expect(err.message).toBe("errors.internal");
  });

  it("meta is optional and defaults to undefined", () => {
    const err = new AppError("UNAUTHORIZED", "errors.auth.required");
    expect(err.meta).toBeUndefined();
  });

  const codes: AppErrorCode[] = [
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "BAD_REQUEST",
    "PRECONDITION_FAILED",
    "INTERNAL",
  ];

  it.each(codes)("supports error code: %s", (code) => {
    const err = new AppError(code, `errors.${code.toLowerCase()}`);
    expect(err.code).toBe(code);
  });
});
