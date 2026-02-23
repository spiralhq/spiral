import type { FiltersValue, SortDir, BaseQueryInput } from "./query.dto";
import type { QueryInput, QueryOptions, QueryResult } from "./query.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_SORT_DIR: SortDir = "asc";

export function normalizeQueryInput<
  TSortBy extends string = string,
  TFilters extends Record<string, FiltersValue> = Record<string, FiltersValue>,
>(
  input: Partial<BaseQueryInput>,
  options?: {
    allowedSortBy?: readonly TSortBy[];
    defaultSortBy?: TSortBy;
    defaultSortDir?: SortDir;
  },
): QueryInput<TSortBy, TFilters> {
  const page = Math.max(1, input.page ?? DEFAULT_PAGE);
  const pageSize = clampPageSize(input.pageSize ?? DEFAULT_PAGE_SIZE);

  const sortDir = normalizeSortDir(input.sortDir, options?.defaultSortDir);
  const sortBy = normalizeSortBy(input.sortBy, options?.allowedSortBy, options?.defaultSortBy);

  const q = normalizeSearch(input.q);
  const filters = normalizeFilters<TFilters>(input.filters);

  return {
    page,
    pageSize,
    sortBy,
    sortDir,
    q,
    filters,
  };
}

export function clampPageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.max(1, Math.floor(pageSize)), MAX_PAGE_SIZE);
}

export function normalizeSortDir(
  sortDir: string | undefined,
  defaultDir: SortDir = DEFAULT_SORT_DIR,
): SortDir {
  if (sortDir === "asc" || sortDir === "desc") {
    return sortDir;
  }
  return defaultDir;
}

export function normalizeSortBy<TSortBy extends string>(
  sortBy: string | undefined,
  allowedValues?: readonly TSortBy[],
  defaultValue?: TSortBy,
): TSortBy | null {
  if (!sortBy) {
    return defaultValue ?? null;
  }

  if (allowedValues && !allowedValues.includes(sortBy as TSortBy)) {
    return defaultValue ?? null;
  }

  return sortBy as TSortBy;
}

export function normalizeSearch(q: string | undefined): string | null {
  if (!q || typeof q !== "string") {
    return null;
  }
  const trimmed = q.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeFilters<
  TFilters extends Record<string, FiltersValue> = Record<string, FiltersValue>,
>(filters: Record<string, FiltersValue> | undefined): TFilters | null {
  if (!filters || typeof filters !== "object") {
    return null;
  }

  const entries = Object.entries(filters).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries) as TFilters;
}

export function toQueryOptions<TSortBy extends string = string>(
  input: QueryInput<TSortBy>,
): QueryOptions<TSortBy> {
  const offset = (input.page - 1) * input.pageSize;

  return {
    page: input.page,
    pageSize: input.pageSize,
    offset,
    limit: input.pageSize,
    sortBy: input.sortBy,
    sortDir: input.sortDir,
    q: input.q,
    filters: input.filters,
  };
}

export function buildQueryResult<T>(items: T[], total: number, input: QueryInput): QueryResult<T> {
  const totalPages = Math.ceil(total / input.pageSize);

  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages,
    sortBy: input.sortBy,
    sortDir: input.sortDir,
    q: input.q,
    filters: input.filters,
  };
}

export function parseQueryParams(
  params: Record<string, string | undefined>,
): Partial<BaseQueryInput> {
  const result: Partial<BaseQueryInput> = {};

  if (params.page) {
    const page = parseInt(params.page, 10);
    if (!isNaN(page)) {
      result.page = page;
    }
  }

  if (params.pageSize) {
    const pageSize = parseInt(params.pageSize, 10);
    if (!isNaN(pageSize)) {
      result.pageSize = pageSize;
    }
  }

  if (params.sortBy) {
    result.sortBy = params.sortBy;
  }

  if (params.sortDir) {
    result.sortDir = params.sortDir as "asc" | "desc";
  }

  if (params.q) {
    result.q = params.q;
  }

  if (params.filters) {
    try {
      const parsed = JSON.parse(params.filters);
      if (typeof parsed === "object" && parsed !== null) {
        result.filters = parsed;
      }
    } catch {}
  }

  return result;
}
