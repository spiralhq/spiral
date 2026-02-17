import { initTRPC } from "@trpc/server";
import type { Context } from "../context";

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const cause = error.cause as any;

    return {
      ...shape,
      data: {
        ...shape.data,
        i18nKey:
          cause?.i18nKey ??
          (error.code === "INTERNAL_SERVER_ERROR" ? "errors.internal" : "errors.unknown"),
        meta: cause?.meta ?? null,
      },
    };
  },
});

export const router = t.router;
