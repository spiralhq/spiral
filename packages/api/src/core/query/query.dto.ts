import { z } from "zod";

export const SortDirDto = z.enum(["asc", "desc"]).default("asc");

export const PaginationInputDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const SortInputDto = z.object({
  sortBy: z.string().optional(),
  sortDir: SortDirDto.optional(),
});

export const SearchInputDto = z.object({
  q: z.string().optional(),
});

export const FiltersValueDto = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
]);

export const FiltersInputDto = z.record(z.string(), FiltersValueDto).optional();

export const BaseQueryInputDto = PaginationInputDto.merge(SortInputDto)
  .merge(SearchInputDto)
  .extend({
    filters: FiltersInputDto,
  });

export function createQueryInputDto<T extends readonly string[]>(sortByValues: T) {
  return BaseQueryInputDto.extend({
    sortBy: z.enum(sortByValues as unknown as [string, ...string[]]).optional(),
  });
}

export function createQueryResultDto<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
    sortBy: z.string().nullable(),
    sortDir: SortDirDto,
    q: z.string().nullable(),
    filters: z.record(z.string(), FiltersValueDto).nullable(),
  });
}

export type SortDir = z.infer<typeof SortDirDto>;
export type PaginationInput = z.infer<typeof PaginationInputDto>;
export type SortInput = z.infer<typeof SortInputDto>;
export type SearchInput = z.infer<typeof SearchInputDto>;
export type FiltersValue = z.infer<typeof FiltersValueDto>;
export type FiltersInput = z.infer<typeof FiltersInputDto>;
export type BaseQueryInput = z.infer<typeof BaseQueryInputDto>;
