import { router } from "../core/trpc/init";
import { publicProcedure } from "../core/trpc/procedures";
import { authRouter } from "../features/auth";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
