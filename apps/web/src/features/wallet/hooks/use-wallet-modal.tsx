import { useContext } from "react";
import { WalletModalContext } from "../providers/wallet-modal-provider";

export function useWalletModal() {
  const context = useContext(WalletModalContext);

  if (!context) {
    throw new Error("useWalletModal must be used within a WalletModalProvider");
  }
  return context;
}
