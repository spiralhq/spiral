import { describe, it, expect } from "vitest";
import { RequestChallengeInputDto, RequestChallengeOutputDto } from "./request-challenge.dto";
import { VerifyInputDto, VerifyOutputDto } from "./verify.dto";
import { MeOutputDto } from "./me.dto";

describe("RequestChallengeInputDto", () => {
  it("accepts valid input", () => {
    const result = RequestChallengeInputDto.safeParse({
      publicKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing publicKey", () => {
    const result = RequestChallengeInputDto.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects publicKey shorter than 32 chars", () => {
    const result = RequestChallengeInputDto.safeParse({ publicKey: "short" });
    expect(result.success).toBe(false);
  });
});

describe("RequestChallengeOutputDto", () => {
  it("accepts valid output", () => {
    const result = RequestChallengeOutputDto.safeParse({
      message: "Spiral Auth\nNonce: abc123\nWallet: xyz",
      nonce: "abc123def456abc123def456abc12345",
    });
    expect(result.success).toBe(true);
  });
});

describe("VerifyInputDto", () => {
  it("accepts valid input with inviteToken", () => {
    const result = VerifyInputDto.safeParse({
      publicKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      signature: "abc123def456signature",
      nonce: "abc123def456nonce",
      inviteToken: "invite-token-abc",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input without inviteToken", () => {
    const result = VerifyInputDto.safeParse({
      publicKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      signature: "abc123def456signature",
      nonce: "abc123def456nonce",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.inviteToken).toBeUndefined();
    }
  });

  it("rejects empty signature", () => {
    const result = VerifyInputDto.safeParse({
      publicKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      signature: "",
      nonce: "abc123def456nonce",
    });
    expect(result.success).toBe(false);
  });
});

describe("VerifyOutputDto", () => {
  it("accepts { success: true }", () => {
    const result = VerifyOutputDto.safeParse({ success: true });
    expect(result.success).toBe(true);
  });

  it("rejects { success: false }", () => {
    const result = VerifyOutputDto.safeParse({ success: false });
    expect(result.success).toBe(false);
  });
});

describe("MeOutputDto", () => {
  it("accepts a full user object", () => {
    const result = MeOutputDto.safeParse({
      publicKey: "wallet123",
      name: "Alice",
      organization: { id: "org-1", name: "Test Org" },
      role: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null", () => {
    const result = MeOutputDto.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("accepts null fields", () => {
    const result = MeOutputDto.safeParse({
      publicKey: "wallet123",
      name: null,
      organization: null,
      role: null,
    });
    expect(result.success).toBe(true);
  });
});
