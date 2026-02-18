import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WalletModalContext } from "../providers/wallet-modal-provider";
import { useWalletModal } from "./use-wallet-modal";

function createWrapper(initial: { visible: boolean; setVisible: (v: boolean) => void }) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <WalletModalContext.Provider value={initial}>{children}</WalletModalContext.Provider>;
  };
}

describe("useWalletModal", () => {
  it("throws when used outside WalletModalProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      renderHook(() => useWalletModal());
    }).toThrow("useWalletModal must be used within a WalletModalProvider");
    spy.mockRestore();
  });

  it("returns visible=false initially when provider starts closed", () => {
    const setVisible = vi.fn();
    const { result } = renderHook(() => useWalletModal(), {
      wrapper: createWrapper({ visible: false, setVisible }),
    });

    expect(result.current.visible).toBe(false);
  });

  it("returns visible=true when provider starts open", () => {
    const setVisible = vi.fn();
    const { result } = renderHook(() => useWalletModal(), {
      wrapper: createWrapper({ visible: true, setVisible }),
    });

    expect(result.current.visible).toBe(true);
  });

  it("exposes setVisible to open/close the modal", () => {
    const setVisible = vi.fn();
    const { result } = renderHook(() => useWalletModal(), {
      wrapper: createWrapper({ visible: false, setVisible }),
    });

    result.current.setVisible(true);
    expect(setVisible).toHaveBeenCalledWith(true);

    result.current.setVisible(false);
    expect(setVisible).toHaveBeenCalledWith(false);
  });
});
