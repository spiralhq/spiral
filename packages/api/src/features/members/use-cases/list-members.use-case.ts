import { membersRepository } from "../repositories/members.repository";
import type { ListMembersOutput, MemberFilters, MemberSortBy } from "../dtos/list-members.dto";
import {
  normalizeQueryInput,
  toQueryOptions,
  buildQueryResult,
  type QueryInput,
} from "../../../core/query";

export type ListMembersUseCaseInput = {
  organizationId: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
  q?: string;
  filters?: MemberFilters;
};

const ALLOWED_SORT_BY = ["name", "role", "publicKey", "createdAt"] as const;

export async function listMembersUseCase(
  input: ListMembersUseCaseInput,
): Promise<ListMembersOutput> {
  const queryInput = normalizeQueryInput<MemberSortBy, MemberFilters>(
    {
      page: input.page,
      pageSize: input.pageSize,
      sortBy: input.sortBy,
      sortDir: input.sortDir as "asc" | "desc" | undefined,
      q: input.q,
      filters: input.filters,
    },
    {
      allowedSortBy: ALLOWED_SORT_BY,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc",
    },
  );

  const queryOptions = toQueryOptions(queryInput);

  const { items, total } = await membersRepository.listWithQuery({
    organizationId: input.organizationId,
    offset: queryOptions.offset,
    limit: queryOptions.limit,
    sortBy: queryOptions.sortBy,
    sortDir: queryOptions.sortDir,
    q: queryOptions.q,
    filters: queryOptions.filters as MemberFilters | null,
  });

  return buildQueryResult(items, total, queryInput as QueryInput);
}
