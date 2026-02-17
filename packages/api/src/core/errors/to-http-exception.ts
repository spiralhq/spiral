import { HTTPException } from "hono/http-exception";
import { AppError } from "./app-error";

type ErrorPayload = {
  error: {
    code: AppError["code"] | "INTERNAL";
    i18nKey: string;
    meta: Record<string, unknown> | null;
  };
};

export function toHttpException(err: unknown): HTTPException {
  if (err instanceof HTTPException) return err;

  if (err instanceof AppError) {
    const status = mapStatus(err.code);

    const payload: ErrorPayload = {
      error: {
        code: err.code,
        i18nKey: err.i18nKey,
        meta: (err.meta ?? null) as Record<string, unknown> | null,
      },
    };

    return new HTTPException(status, {
      res: Response.json(payload, { status }),
      cause: err.meta ?? null,
    });
  }

  const payload: ErrorPayload = {
    error: {
      code: "INTERNAL",
      i18nKey: "errors.internal",
      meta: null,
    },
  };

  return new HTTPException(500, {
    res: Response.json(payload, { status: 500 }),
    cause: err,
  });
}

function mapStatus(code: AppError["code"]) {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "BAD_REQUEST":
      return 400;
    case "PRECONDITION_FAILED":
      return 412;
    default:
      return 500;
  }
}
