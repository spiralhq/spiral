import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  let listeners: Array<() => void>;

  beforeEach(() => {
    listeners = [];
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: window.innerWidth < 768,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (_event: string, handler: () => void) => {
          listeners.push(handler);
        },
        removeEventListener: (_event: string, handler: () => void) => {
          listeners = listeners.filter((l) => l !== handler);
        },
        dispatchEvent: () => false,
      }),
    });
  });

  it("returns false for desktop viewport (width >= 768)", async () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("returns true for mobile viewport (width < 768)", async () => {
    Object.defineProperty(window, "innerWidth", { value: 375, configurable: true });

    vi.resetModules();
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("responds to viewport changes via matchMedia listener", async () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });

    vi.resetModules();
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, "innerWidth", { value: 500, configurable: true });
      for (const listener of listeners) listener();
    });

    expect(result.current).toBe(true);
  });
});
