import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestChallengeUseCase } from "./request-challenge.use-case";
import { authRepository } from "../repositories/auth.repository";

vi.mock("../repositories/auth.repository", () => ({
  authRepository: {
    createChallenge: vi.fn(),
  },
}));

const mockedCreateChallenge = vi.mocked(authRepository.createChallenge);

describe("requestChallengeUseCase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T12:00:00.000Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a message and nonce", async () => {
    const result = await requestChallengeUseCase({ publicKey: "wallet123" });

    expect(result.message).toContain("Spiral Auth");
    expect(result.message).toContain("wallet123");
    expect(result.message).toContain(result.nonce);
    expect(typeof result.nonce).toBe("string");
    expect(result.nonce.length).toBe(32);
  });

  it("generates different nonces for different calls", async () => {
    const result1 = await requestChallengeUseCase({ publicKey: "wallet1" });
    const result2 = await requestChallengeUseCase({ publicKey: "wallet1" });

    expect(result1.nonce).not.toBe(result2.nonce);
  });

  it("persists challenge via repository with correct input", async () => {
    const result = await requestChallengeUseCase({ publicKey: "wallet123" });

    expect(mockedCreateChallenge).toHaveBeenCalledOnce();
    expect(mockedCreateChallenge).toHaveBeenCalledWith({
      publicKey: "wallet123",
      nonce: result.nonce,
      message: result.message,
      expiresAt: expect.any(Date),
    });
  });

  it("sets expiresAt to ~5 minutes in the future", async () => {
    await requestChallengeUseCase({ publicKey: "wallet123" });

    const callArg = mockedCreateChallenge.mock.calls[0]![0];
    const expected = new Date("2025-06-01T12:05:00.000Z");

    expect(callArg.expiresAt.getTime()).toBe(expected.getTime());
  });

  it("message format is 'Spiral Auth\\nNonce: <nonce>\\nWallet: <publicKey>'", async () => {
    const result = await requestChallengeUseCase({ publicKey: "myWallet" });

    expect(result.message).toBe(`Spiral Auth\nNonce: ${result.nonce}\nWallet: myWallet`);
  });
});
