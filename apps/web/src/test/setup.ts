import "@testing-library/jest-dom/vitest";
import { TextEncoder, TextDecoder } from "util";

if (typeof globalThis.TextEncoder === "undefined") {
  Object.assign(globalThis, {
    TextEncoder,
    TextDecoder,
  });
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
