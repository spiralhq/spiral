import { describe, it, expect } from "vitest";
import {
  ListMembersOutputDto,
  ListMembersInputDto,
  MemberItemDto,
  MemberFiltersDto,
  MemberSortByValues,
} from "./list-members.dto";

describe("MemberItemDto", () => {
  it("accepts valid member item with all fields", () => {
    const result = MemberItemDto.safeParse({
      userPublicKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      name: "Alice",
      role: 1,
      pda: "member-pda-123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null name", () => {
    const result = MemberItemDto.safeParse({
      userPublicKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      name: null,
      role: 2,
      pda: "member-pda-123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeNull();
    }
  });

  it("accepts null pda", () => {
    const result = MemberItemDto.safeParse({
      userPublicKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      name: "Bob",
      role: 1,
      pda: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pda).toBeNull();
    }
  });

  it("rejects missing userPublicKey", () => {
    const result = MemberItemDto.safeParse({
      name: "Alice",
      role: 1,
      pda: "member-pda-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing role", () => {
    const result = MemberItemDto.safeParse({
      userPublicKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      name: "Alice",
      pda: "member-pda-123",
    });
    expect(result.success).toBe(false);
  });
});

describe("ListMembersOutputDto", () => {
  it("accepts valid paginated output", () => {
    const result = ListMembersOutputDto.safeParse({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
      sortBy: null,
      sortDir: "asc",
      q: null,
      filters: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts output with items", () => {
    const result = ListMembersOutputDto.safeParse({
      items: [
        {
          userPublicKey: "wallet1",
          name: "Alice",
          role: 1,
          pda: "pda1",
        },
        {
          userPublicKey: "wallet2",
          name: null,
          role: 2,
          pda: null,
        },
      ],
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
      sortBy: "name",
      sortDir: "desc",
      q: "alice",
      filters: { role: 1 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0]?.name).toBe("Alice");
      expect(result.data.items[1]?.name).toBeNull();
    }
  });

  it("rejects missing pagination fields", () => {
    const result = ListMembersOutputDto.safeParse({
      items: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("ListMembersInputDto", () => {
  it("accepts empty input with defaults", () => {
    const result = ListMembersInputDto.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("accepts valid pagination params", () => {
    const result = ListMembersInputDto.safeParse({
      page: 2,
      pageSize: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it("accepts valid sort params", () => {
    const result = ListMembersInputDto.safeParse({
      sortBy: "name",
      sortDir: "desc",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe("name");
      expect(result.data.sortDir).toBe("desc");
    }
  });

  it("rejects invalid sortBy value", () => {
    const result = ListMembersInputDto.safeParse({
      sortBy: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid search param", () => {
    const result = ListMembersInputDto.safeParse({
      q: "alice",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("alice");
    }
  });

  it("accepts valid filters", () => {
    const result = ListMembersInputDto.safeParse({
      filters: { role: 1, hasPda: true },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filters).toEqual({ role: 1, hasPda: true });
    }
  });

  it("coerces string page to number", () => {
    const result = ListMembersInputDto.safeParse({
      page: "3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
    }
  });
});

describe("MemberFiltersDto", () => {
  it("accepts valid role filter", () => {
    expect(MemberFiltersDto.safeParse({ role: 1 }).success).toBe(true);
    expect(MemberFiltersDto.safeParse({ role: 2 }).success).toBe(true);
  });

  it("rejects invalid role value", () => {
    expect(MemberFiltersDto.safeParse({ role: 3 }).success).toBe(false);
  });

  it("accepts valid hasPda filter", () => {
    expect(MemberFiltersDto.safeParse({ hasPda: true }).success).toBe(true);
    expect(MemberFiltersDto.safeParse({ hasPda: false }).success).toBe(true);
  });

  it("accepts combined filters", () => {
    const result = MemberFiltersDto.safeParse({ role: 1, hasPda: true });
    expect(result.success).toBe(true);
  });
});

describe("MemberSortByValues", () => {
  it("contains expected sort fields", () => {
    expect(MemberSortByValues).toContain("name");
    expect(MemberSortByValues).toContain("role");
    expect(MemberSortByValues).toContain("publicKey");
    expect(MemberSortByValues).toContain("createdAt");
  });
});
