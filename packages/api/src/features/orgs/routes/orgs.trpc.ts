import { setCookie } from "hono/cookie";

import { ListMineOutputDto } from "../dtos/list-mine.dto";
import { SwitchOrgInputDto, SwitchOrgOutputDto } from "../dtos/switch.dto";
import { listMyOrganizationsUseCase } from "../use-cases/list-my-organizations.use-case";
import { switchOrganizationUseCase } from "../use-cases/switch-organization.use-case";

import { protectedProcedure } from "../../../core/trpc/procedures";
import { trpcTry } from "../../../core/trpc/catch";
import { router } from "../../../core/trpc/init";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "../../auth/routes/session-cookie";

export const orgsRouter = router({
  listMine: protectedProcedure.output(ListMineOutputDto).query(({ ctx }) =>
    trpcTry(() =>
      listMyOrganizationsUseCase({
        publicKey: ctx.session.publicKey,
        currentOrganizationId: ctx.session.organizationId,
      }),
    ),
  ),

  switch: protectedProcedure
    .input(SwitchOrgInputDto)
    .output(SwitchOrgOutputDto)
    .mutation(({ input, ctx }) =>
      trpcTry(async () => {
        const { token } = await switchOrganizationUseCase({
          publicKey: ctx.session.publicKey,
          organizationId: input.organizationId,
        });
        setCookie(ctx.hono, SESSION_COOKIE_NAME, token, sessionCookieOptions());
        return { success: true as const };
      }),
    ),
});
