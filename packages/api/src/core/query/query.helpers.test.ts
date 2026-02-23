import { describe, it, expect } from "vitest";
import {
  clampPageSize,
  normalizeSortDir,
  normalizeSortBy,
  normalizeSearch,
  normalizeFilters,
  normalizeQueryInput,
  toQueryOptions,
  buildQueryResult,
  parseQueryParams,
} from "./query.helpers";

describe("clampPageSize", () => {
  it("returns default for NaN", () => {
    expect(clampPageSize(NaN)).toBe(20);
  });

  it("returns default for negative values", () => {
    expect(clampPageSize(-5)).toBe(20);
  });

  it("returns default for zero", () => {
    expect(clampPageSize(0)).toBe(20);
  });

  it("clamps to max 100", () => {
    expect(clampPageSize(150)).toBe(100);
  });

  it("rounds down floats", () => {
    expect(clampPageSize(25.9)).toBe(25);
  });

  it("returns valid page size as-is", () => {
    expect(clampPageSize(50)).toBe(50);
  });

  it("returns default for Infinity", () => {
    expect(clampPageSize(Infinity)).toBe(20);
  });
});

describe("normalizeSortDir", () => {
  it("returns 'asc' for 'asc'", () => {
    expect(normalizeSortDir("asc")).toBe("asc");
  });

  it("returns 'desc' for 'desc'", () => {
    expect(normalizeSortDir("desc")).toBe("desc");
  });

  it("returns default 'asc' for undefined", () => {
    expect(normalizeSortDir(undefined)).toBe("asc");
  });

  it("returns default 'asc' for invalid value", () => {
    expect(normalizeSortDir("invalid")).toBe("asc");
  });

  it("uses custom default when provided", () => {
    expect(normalizeSortDir(undefined, "desc")).toBe("desc");
    expect(normalizeSortDir("invalid", "desc")).toBe("desc");
  });
});

describe("normalizeSortBy", () => {
  const allowedValues = ["name", "role", "createdAt"] as const;

  it("returns null for undefined sortBy", () => {
    expect(normalizeSortBy(undefined)).toBeNull();
  });

  it("returns value when in allowed list", () => {
    expect(normalizeSortBy("name", allowedValues)).toBe("name");
    expect(normalizeSortBy("role", allowedValues)).toBe("role");
  });

  it("returns null for value not in allowed list", () => {
    expect(normalizeSortBy("invalid", allowedValues)).toBeNull();
  });

  it("uses default when provided and value is undefined", () => {
    expect(normalizeSortBy(undefined, allowedValues, "createdAt")).toBe("createdAt");
  });

  it("uses default when value is not in allowed list", () => {
    expect(normalizeSortBy("invalid", allowedValues, "name")).toBe("name");
  });

  it("returns value as-is when no allowed list", () => {
    expect(normalizeSortBy("anything")).toBe("anything");
  });
});

describe("normalizeSearch", () => {
  it("returns null for undefined", () => {
    expect(normalizeSearch(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeSearch("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(normalizeSearch("   ")).toBeNull();
  });

  it("trims whitespace", () => {
    expect(normalizeSearch("  hello  ")).toBe("hello");
  });

  it("returns valid search string", () => {
    expect(normalizeSearch("alice")).toBe("alice");
  });
});

describe("normalizeFilters", () => {
  it("returns null for undefined", () => {
    expect(normalizeFilters(undefined)).toBeNull();
  });

  it("returns null for empty object", () => {
    expect(normalizeFilters({})).toBeNull();
  });

  it("returns null when all values are empty", () => {
    expect(normalizeFilters({ name: "", arr: [] })).toBeNull();
  });

  it("filters out null/undefined values", () => {
    const result = normalizeFilters({ role: 1, empty: undefined as any });
    expect(result).toEqual({ role: 1 });
  });

  it("filters out empty strings", () => {
    const result = normalizeFilters({ role: 2, name: "" });
    expect(result).toEqual({ role: 2 });
  });

  it("filters out empty arrays", () => {
    const result = normalizeFilters({ hasPda: true, tags: [] });
    expect(result).toEqual({ hasPda: true });
  });

  it("keeps valid values", () => {
    const result = normalizeFilters({ role: 1, hasPda: false, ids: ["a", "b"] });
    expect(result).toEqual({ role: 1, hasPda: false, ids: ["a", "b"] });
  });
});

describe("normalizeQueryInput", () => {
  it("applies defaults for empty input", () => {
    const result = normalizeQueryInput({});
    expect(result).toEqual({
      page: 1,
      pageSize: 20,
      sortBy: null,
      sortDir: "asc",
      q: null,
      filters: null,
    });
  });

  it("uses provided page and pageSize", () => {
    const result = normalizeQueryInput({ page: 3, pageSize: 50 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("clamps page to minimum 1", () => {
    const result = normalizeQueryInput({ page: -5 });
    expect(result.page).toBe(1);
  });

  it("uses allowed sortBy values", () => {
    const allowed = ["name", "role"] as const;
    const result = normalizeQueryInput({ sortBy: "name" }, { allowedSortBy: allowed });
    expect(result.sortBy).toBe("name");
  });

  it("rejects invalid sortBy values", () => {
    const allowed = ["name", "role"] as const;
    const result = normalizeQueryInput({ sortBy: "invalid" }, { allowedSortBy: allowed });
    expect(result.sortBy).toBeNull();
  });

  it("uses defaultSortBy when sortBy is invalid", () => {
    const allowed = ["name", "role"] as const;
    const result = normalizeQueryInput(
      { sortBy: "invalid" },
      { allowedSortBy: allowed, defaultSortBy: "name" }
    );
    expect(result.sortBy).toBe("name");
  });

  it("uses defaultSortDir", () => {
    const result = normalizeQueryInput({}, { defaultSortDir: "desc" });
    expect(result.sortDir).toBe("desc");
  });

  it("normalizes search string", () => {
    const result = normalizeQueryInput({ q: "  alice  " });
    expect(result.q).toBe("alice");
  });

  it("normalizes filters", () => {
    const result = normalizeQueryInput({ filters: { role: 1, empty: "" } });
    expect(result.filters).toEqual({ role: 1 });
  });
});

describe("toQueryOptions", () => {
  it("calculates offset correctly", () => {
    const input = {
      page: 3,
      pageSize: 20,
      sortBy: "name" as const,
      sortDir: "asc" as const,
      q: null,
      filters: null,
    };
    const options = toQueryOptions(input);
    expect(options.offset).toBe(40);
    expect(options.limit).toBe(20);
  });

  it("offset is 0 for page 1", () => {
    const input = {
      page: 1,
      pageSize: 10,
      sortBy: null,
      sortDir: "desc" as const,
      q: "search",
      filters: { role: 1 },
    };
    const options = toQueryOptions(input);
    expect(options.offset).toBe(0);
    expect(options.limit).toBe(10);
  });

  it("preserves all input fields", () => {
    const input = {
      page: 2,
      pageSize: 25,
      sortBy: "role" as const,
      sortDir: "desc" as const,
      q: "test",
      filters: { hasPda: true },
    };
    const options = toQueryOptions(input);
    expect(options).toEqual({
      page: 2,
      pageSize: 25,
      offset: 25,
      limit: 25,
      sortBy: "role",
      sortDir: "desc",
      q: "test",
      filters: { hasPda: true },
    });
  });
});

describe("buildQueryResult", () => {
  it("calculates totalPages correctly", () => {
    const items = [{ id: 1 }, { id: 2 }];
    const input = {
      page: 1,
      pageSize: 2,
      sortBy: null,
      sortDir: "asc" as const,
      q: null,
      filters: null,
    };
    const result = buildQueryResult(items, 10, input);
    expect(result.totalPages).toBe(5);
  });

  it("totalPages is 0 for empty result", () => {
    const input = {
      page: 1,
      pageSize: 20,
      sortBy: null,
      sortDir: "asc" as const,
      q: null,
      filters: null,
    };
    const result = buildQueryResult([], 0, input);
    expect(result.totalPages).toBe(0);
  });

  it("returns complete result object", () => {
    const items = [{ name: "Alice" }];
    const input = {
      page: 2,
      pageSize: 10,
      sortBy: "name",
      sortDir: "desc" as const,
      q: "alice",
      filters: { role: 1 },
    };
    const result = buildQueryResult(items, 15, input);
    expect(result).toEqual({
      items: [{ name: "Alice" }],
      page: 2,
      pageSize: 10,
      total: 15,
      totalPages: 2,
      sortBy: "name",
      sortDir: "desc",
      q: "alice",
      filters: { role: 1 },
    });
  });
});

describe("parseQueryParams", () => {
  it("parses page as integer", () => {
    const result = parseQueryParams({ page: "3" });
    expect(result.page).toBe(3);
  });

  it("ignores invalid page", () => {
    const result = parseQueryParams({ page: "abc" });
    expect(result.page).toBeUndefined();
  });

  it("parses pageSize as integer", () => {
    const result = parseQueryParams({ pageSize: "50" });
    expect(result.pageSize).toBe(50);
  });

  it("ignores invalid pageSize", () => {
    const result = parseQueryParams({ pageSize: "xyz" });
    expect(result.pageSize).toBeUndefined();
  });

  it("parses sortBy", () => {
    const result = parseQueryParams({ sortBy: "name" });
    expect(result.sortBy).toBe("name");
  });

  it("parses sortDir", () => {
    const result = parseQueryParams({ sortDir: "desc" });
    expect(result.sortDir).toBe("desc");
  });

  it("parses q (search)", () => {
    const result = parseQueryParams({ q: "alice" });
    expect(result.q).toBe("alice");
  });

  it("parses valid JSON filters", () => {
    const result = parseQueryParams({ filters: '{"role":1,"hasPda":true}' });
    expect(result.filters).toEqual({ role: 1, hasPda: true });
  });

  it("ignores invalid JSON filters", () => {
    const result = parseQueryParams({ filters: "invalid-json" });
    expect(result.filters).toBeUndefined();
  });

  it("ignores non-object JSON filters", () => {
    const result = parseQueryParams({ filters: '"just a string"' });
    expect(result.filters).toBeUndefined();
  });

  it("returns empty object for no params", () => {
    const result = parseQueryParams({});
    expect(result).toEqual({});
  });

  it("parses all params together", () => {
    const result = parseQueryParams({
      page: "2",
      pageSize: "25",
      sortBy: "role",
      sortDir: "desc",
      q: "search",
      filters: '{"role":1}',
    });
    expect(result).toEqual({
      page: 2,
      pageSize: 25,
      sortBy: "role",
      sortDir: "desc",
      q: "search",
      filters: { role: 1 },
    });
  });
});
