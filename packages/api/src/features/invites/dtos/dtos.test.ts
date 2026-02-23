import { describe, it, expect } from "vitest";
import { CreateInviteInputDto, CreateInviteOutputDto } from "./create-invite.dto";

describe("CreateInviteInputDto", () => {
  it("accepts valid input with email and role", () => {
    const result = CreateInviteInputDto.safeParse({
      email: "test@example.com",
      role: 2,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with email only (role defaults to 2)", () => {
    const result = CreateInviteInputDto.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe(2);
    }
  });

  it("accepts role 1 (admin)", () => {
    const result = CreateInviteInputDto.safeParse({
      email: "admin@example.com",
      role: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe(1);
    }
  });

  it("rejects missing email", () => {
    const result = CreateInviteInputDto.safeParse({
      role: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = CreateInviteInputDto.safeParse({
      email: "not-an-email",
      role: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects role less than 1", () => {
    const result = CreateInviteInputDto.safeParse({
      email: "test@example.com",
      role: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects role greater than 2", () => {
    const result = CreateInviteInputDto.safeParse({
      email: "test@example.com",
      role: 3,
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateInviteOutputDto", () => {
  it("accepts valid output with success and inviteId", () => {
    const result = CreateInviteOutputDto.safeParse({
      success: true,
      inviteId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing inviteId", () => {
    const result = CreateInviteOutputDto.safeParse({
      success: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid uuid for inviteId", () => {
    const result = CreateInviteOutputDto.safeParse({
      success: true,
      inviteId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects success: false", () => {
    const result = CreateInviteOutputDto.safeParse({
      success: false,
      inviteId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });
});
