import { describe, it, expect } from "vitest";
import { logoutUseCase } from "./logout.use-case";

describe("logoutUseCase", () => {
  it("returns { success: true }", async () => {
    const result = await logoutUseCase();
    expect(result).toEqual({ success: true });
  });

  it("returns success as a literal true", async () => {
    const result = await logoutUseCase();
    expect(result.success).toBe(true);
  });
});
