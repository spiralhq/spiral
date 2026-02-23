import { router } from "../core/trpc/init";
import { publicProcedure } from "../core/trpc/procedures";
import { authRouter } from "../features/auth";
import { orgsRouter } from "../features/orgs";
import { membersRouter } from "../features/members";
import { invitesRouter } from "../features/invites";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  auth: authRouter,
  orgs: orgsRouter,
  members: membersRouter,
  invites: invitesRouter,
});

export type AppRouter = typeof appRouter;
