import { describe, it, expect } from "vitest";
import { ListMineOutputDto, ListMineOrganizationItemDto } from "./list-mine.dto";
import { SwitchOrgInputDto, SwitchOrgOutputDto } from "./switch.dto";

describe("ListMineOrganizationItemDto", () => {
  it("accepts valid organization item with all fields", () => {
    const result = ListMineOrganizationItemDto.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Org",
      slug: "test-org",
      pda: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      role: 1,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts isActive as false", () => {
    const result = ListMineOrganizationItemDto.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Org",
      slug: "test-org",
      pda: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      role: 2,
      isActive: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(false);
    }
  });

  it("rejects missing isActive field", () => {
    const result = ListMineOrganizationItemDto.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Org",
      slug: "test-org",
      pda: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      role: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid uuid for id", () => {
    const result = ListMineOrganizationItemDto.safeParse({
      id: "not-a-uuid",
      name: "Test Org",
      slug: "test-org",
      pda: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      role: 1,
      isActive: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("ListMineOutputDto", () => {
  it("accepts empty array", () => {
    const result = ListMineOutputDto.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("accepts array with multiple organizations", () => {
    const result = ListMineOutputDto.safeParse([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Org 1",
        slug: "org-1",
        pda: "pda1",
        role: 1,
        isActive: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Org 2",
        slug: "org-2",
        pda: "pda2",
        role: 2,
        isActive: false,
      },
    ]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.isActive).toBe(true);
      expect(result.data[1]?.isActive).toBe(false);
    }
  });

  it("rejects array with invalid item", () => {
    const result = ListMineOutputDto.safeParse([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Org 1",
        slug: "org-1",
        pda: "pda1",
        role: 1,
        // missing isActive
      },
    ]);
    expect(result.success).toBe(false);
  });
});

describe("SwitchOrgInputDto", () => {
  it("accepts valid organizationId", () => {
    const result = SwitchOrgInputDto.safeParse({
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing organizationId", () => {
    const result = SwitchOrgInputDto.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-uuid organizationId", () => {
    const result = SwitchOrgInputDto.safeParse({
      organizationId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("SwitchOrgOutputDto", () => {
  it("accepts { success: true }", () => {
    const result = SwitchOrgOutputDto.safeParse({ success: true });
    expect(result.success).toBe(true);
  });

  it("rejects { success: false }", () => {
    const result = SwitchOrgOutputDto.safeParse({ success: false });
    expect(result.success).toBe(false);
  });
});
