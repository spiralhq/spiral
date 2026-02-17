import { TRPCError } from "@trpc/server";
import { AppError } from "./app-error";

export function toTrpcError(err: unknown): TRPCError {
  if (err instanceof TRPCError) return err;

  if (err instanceof AppError) {
    return new TRPCError({
      code: mapCode(err.code),
      message: "Handled error",
      cause: { i18nKey: err.i18nKey, meta: err.meta ?? null },
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unhandled error",
    cause: { i18nKey: "errors.internal", meta: null },
  });
}

function mapCode(code: AppError["code"]): TRPCError["code"] {
  switch (code) {
    case "UNAUTHORIZED":
      return "UNAUTHORIZED";
    case "FORBIDDEN":
      return "FORBIDDEN";
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "CONFLICT":
      return "CONFLICT";
    case "BAD_REQUEST":
      return "BAD_REQUEST";
    case "PRECONDITION_FAILED":
      return "PRECONDITION_FAILED";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}
