import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMeUseCase } from "./get-me.use-case";
import { authRepository } from "../repositories/auth.repository";

vi.mock("../repositories/auth.repository", () => ({
  authRepository: {
    findMe: vi.fn(),
  },
}));

const mockedFindMe = vi.mocked(authRepository.findMe);

describe("getMeUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user projection when found", async () => {
    const meProjection = {
      publicKey: "wallet123",
      name: "Alice",
      organization: { id: "org-1", name: "Test Org" },
      role: 1,
    };
    mockedFindMe.mockResolvedValue(meProjection);

    const result = await getMeUseCase({ publicKey: "wallet123", organizationId: "org-1" });

    expect(result).toEqual(meProjection);
    expect(mockedFindMe).toHaveBeenCalledWith({
      publicKey: "wallet123",
      organizationId: "org-1",
    });
  });

  it("returns null when user not found", async () => {
    mockedFindMe.mockResolvedValue(null);

    const result = await getMeUseCase({ publicKey: "wallet-unknown", organizationId: "org-1" });

    expect(result).toBeNull();
  });

  it("passes input directly to authRepository.findMe", async () => {
    mockedFindMe.mockResolvedValue(null);

    await getMeUseCase({ publicKey: "pk", organizationId: "oid" });

    expect(mockedFindMe).toHaveBeenCalledOnce();
    expect(mockedFindMe).toHaveBeenCalledWith({ publicKey: "pk", organizationId: "oid" });
  });
});
