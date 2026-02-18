import { describe, it, expect, vi, beforeEach } from "vitest";
import { setLocale } from "./set-locale";

const { mockSet } = vi.hoisted(() => ({
  mockSet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: mockSet,
    get: vi.fn(),
  }),
}));

describe("setLocale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets a cookie with locale 'en'", async () => {
    await setLocale("en");

    expect(mockSet).toHaveBeenCalledWith("locale", "en", {
      path: "/",
      sameSite: "lax",
    });
  });

  it("sets a cookie with locale 'pt-BR'", async () => {
    await setLocale("pt-BR");

    expect(mockSet).toHaveBeenCalledWith("locale", "pt-BR", {
      path: "/",
      sameSite: "lax",
    });
  });

  it("passes through any string as locale (no server-side validation)", async () => {
    await setLocale("invalid-locale");

    expect(mockSet).toHaveBeenCalledWith("locale", "invalid-locale", {
      path: "/",
      sameSite: "lax",
    });
  });

  it("cookie options include path=/ and sameSite=lax", async () => {
    await setLocale("en");

    const options = mockSet.mock.calls[0]![2];
    expect(options).toEqual({
      path: "/",
      sameSite: "lax",
    });
  });
});
