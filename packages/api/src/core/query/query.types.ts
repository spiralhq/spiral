import type { FiltersValue, SortDir } from "./query.dto";

export type QueryInput<
  TSortBy extends string = string,
  TFilters extends Record<string, FiltersValue> = Record<string, FiltersValue>,
> = {
  page: number;
  pageSize: number;
  sortBy: TSortBy | null;
  sortDir: SortDir;
  q: string | null;
  filters: TFilters | null;
};

export type QueryResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sortBy: string | null;
  sortDir: SortDir;
  q: string | null;
  filters: Record<string, FiltersValue> | null;
};

export type QueryOptions<TSortBy extends string = string> = {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
  sortBy: TSortBy | null;
  sortDir: SortDir;
  q: string | null;
  filters: Record<string, FiltersValue> | null;
};
