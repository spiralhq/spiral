import { ListMembersInputDto, ListMembersOutputDto } from "../dtos/list-members.dto";
import { listMembersUseCase } from "../use-cases/list-members.use-case";

import { protectedProcedure } from "../../../core/trpc/procedures";
import { trpcTry } from "../../../core/trpc/catch";
import { router } from "../../../core/trpc/init";

export const membersRouter = router({
  list: protectedProcedure
    .input(ListMembersInputDto)
    .output(ListMembersOutputDto)
    .query(({ ctx, input }) =>
      trpcTry(() =>
        listMembersUseCase({
          organizationId: ctx.session.organizationId,
          page: input.page,
          pageSize: input.pageSize,
          sortBy: input.sortBy,
          sortDir: input.sortDir,
          q: input.q,
          filters: input.filters,
        }),
      ),
    ),
});
