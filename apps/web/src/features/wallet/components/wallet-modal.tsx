"use client";

import { useState, useMemo } from "react";
import { type WalletName, WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet } from "lucide-react";
import { WalletListItem } from "./wallet-list-item";
import { MoreWalletsButton } from "./more-wallets-button";
import { NoWalletsFound } from "./no-wallets-found";
import { useWalletModal } from "../hooks/use-wallet-modal";
import { useTranslations } from "next-intl";

export function WalletModal() {
  const t = useTranslations();
  const { wallets, select } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const [expanded, setExpanded] = useState(false);

  const [listedWallets, collapsedWallets] = useMemo(() => {
    const installed = wallets.filter((wallet) => wallet.readyState === WalletReadyState.Installed);
    const notInstalled = wallets.filter(
      (wallet) => wallet.readyState !== WalletReadyState.Installed,
    );
    return installed.length ? [installed, notInstalled] : [notInstalled, []];
  }, [wallets]);

  const handleWalletClick = (walletName: WalletName) => {
    select(walletName);
    setVisible(false);
  };

  const handleExpandClick = () => setExpanded(!expanded);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader className="py-4">
          <div className="bg-primary/80 text-primary-foreground p-4 rounded-full w-fit mx-auto">
            <Wallet className="size-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-balance">
            {t("wallet.wallet-modal.title")}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-75 border-t">
          <div className="flex flex-col gap-2 p-1">
            {listedWallets.map((wallet) => (
              <WalletListItem
                key={wallet.adapter.name}
                wallet={wallet}
                handleClick={() => handleWalletClick(wallet.adapter.name)}
              />
            ))}
          </div>
          {collapsedWallets.length > 0 && (
            <>
              <MoreWalletsButton expanded={expanded} onClick={handleExpandClick} />
              {expanded &&
                collapsedWallets.map((wallet) => (
                  <WalletListItem
                    key={wallet.adapter.name}
                    wallet={wallet}
                    handleClick={() => handleWalletClick(wallet.adapter.name)}
                  />
                ))}
            </>
          )}
          {wallets.length === 0 && <NoWalletsFound />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
