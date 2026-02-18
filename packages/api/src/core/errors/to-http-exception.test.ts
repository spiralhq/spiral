import { describe, it, expect } from "vitest";
import { HTTPException } from "hono/http-exception";
import { toHttpException } from "./to-http-exception";
import { AppError } from "./app-error";
import type { AppErrorCode } from "./app-error";

describe("toHttpException", () => {
  describe("AppError -> HTTPException mapping", () => {
    const mappings: [AppErrorCode, number][] = [
      ["UNAUTHORIZED", 401],
      ["FORBIDDEN", 403],
      ["NOT_FOUND", 404],
      ["CONFLICT", 409],
      ["BAD_REQUEST", 400],
      ["PRECONDITION_FAILED", 412],
      ["INTERNAL", 500],
    ];

    it.each(mappings)("maps AppError(%s) -> HTTP %d", (code, status) => {
      const meta = { detail: "info" };
      const appErr = new AppError(code, `errors.${code.toLowerCase()}`, meta);
      const httpErr = toHttpException(appErr);

      expect(httpErr).toBeInstanceOf(HTTPException);
      expect(httpErr.status).toBe(status);
    });

    it.each(mappings)(
      "response body contains correct payload for AppError(%s)",
      async (code, status) => {
        const meta = { detail: "info" };
        const appErr = new AppError(code, `errors.${code.toLowerCase()}`, meta);
        const httpErr = toHttpException(appErr);

        const res = httpErr.getResponse();
        expect(res.status).toBe(status);

        const body = await res.json();
        expect(body).toEqual({
          error: {
            code,
            i18nKey: `errors.${code.toLowerCase()}`,
            meta: { detail: "info" },
          },
        });
      },
    );

    it("sets meta to null when AppError has no meta", async () => {
      const appErr = new AppError("BAD_REQUEST", "errors.test");
      const httpErr = toHttpException(appErr);
      const body = (await httpErr.getResponse().json()) as any;

      expect(body.error.meta).toBeNull();
    });
  });

  describe("HTTPException passthrough", () => {
    it("returns the same HTTPException if already an HTTPException", () => {
      const original = new HTTPException(404);
      const result = toHttpException(original);
      expect(result).toBe(original);
    });
  });

  describe("unknown error fallback", () => {
    it("converts a plain Error to 500 with internal error payload", async () => {
      const httpErr = toHttpException(new Error("boom"));

      expect(httpErr).toBeInstanceOf(HTTPException);
      expect(httpErr.status).toBe(500);

      const body = await httpErr.getResponse().json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL",
          i18nKey: "errors.internal",
          meta: null,
        },
      });
    });

    it("converts null to 500", () => {
      const httpErr = toHttpException(null);
      expect(httpErr.status).toBe(500);
    });
  });
});
