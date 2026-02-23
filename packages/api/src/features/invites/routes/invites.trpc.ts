import { CreateInviteInputDto, CreateInviteOutputDto } from "../dtos/create-invite.dto";
import { createInviteUseCase } from "../use-cases/create-invite.use-case";

import { protectedProcedure } from "../../../core/trpc/procedures";
import { trpcTry } from "../../../core/trpc/catch";
import { router } from "../../../core/trpc/init";
import { AppError } from "../../../core/errors/app-error";

const ADMIN_ROLE = 1;

export const invitesRouter = router({
  create: protectedProcedure
    .input(CreateInviteInputDto)
    .output(CreateInviteOutputDto)
    .mutation(({ input, ctx }) =>
      trpcTry(async () => {
        if (ctx.session.role !== ADMIN_ROLE) {
          throw new AppError("FORBIDDEN", "errors.auth.forbidden");
        }

        return createInviteUseCase({
          email: input.email,
          role: input.role,
          organizationId: ctx.session.organizationId,
        });
      }),
    ),
});
