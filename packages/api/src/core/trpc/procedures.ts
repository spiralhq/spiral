import { TRPCError } from "@trpc/server";
import { t } from "./init";

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED", message: "errors.auth.required" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});
