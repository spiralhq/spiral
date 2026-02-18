import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { trpcTry } from "./catch";
import { AppError } from "../errors/app-error";

describe("trpcTry", () => {
  it("returns the value on success", async () => {
    const result = await trpcTry(async () => ({ data: 42 }));
    expect(result).toEqual({ data: 42 });
  });

  it("converts AppError to TRPCError via toTrpcError", async () => {
    await expect(
      trpcTry(async () => {
        throw new AppError("NOT_FOUND", "errors.thing.missing", { id: "123" });
      }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(TRPCError);
      const trpcErr = err as TRPCError;
      expect(trpcErr.code).toBe("NOT_FOUND");
      expect((trpcErr.cause as any).i18nKey).toBe("errors.thing.missing");
      expect((trpcErr.cause as any).meta).toEqual({ id: "123" });
      return true;
    });
  });

  it("converts unknown error to INTERNAL_SERVER_ERROR", async () => {
    await expect(
      trpcTry(async () => {
        throw new Error("boom");
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const trpcErr = err as TRPCError;
      expect(trpcErr.code).toBe("INTERNAL_SERVER_ERROR");
      return true;
    });
  });

  it("passes through TRPCError unchanged", async () => {
    const original = new TRPCError({ code: "FORBIDDEN", message: "nope" });
    await expect(
      trpcTry(async () => {
        throw original;
      }),
    ).rejects.toBe(original);
  });
});
