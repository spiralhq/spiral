"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRightLeft, Copy, LogOut } from "lucide-react";
import { useWalletModal } from "../hooks/use-wallet-modal";
import { WalletIcon } from "./wallet-icon";
import { useLocale, useTranslations, type Locale } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function WalletMultiButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button>) {
  const t = useTranslations();
  const { publicKey, wallet, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const locale = useLocale() as Locale;

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const content = useMemo(() => {
    if (connecting) return t("wallet.wallet-multi-button.connecting");
    if (wallet)
      return base58
        ? `${base58.slice(0, 4)}...${base58.slice(-4)}`
        : t("wallet.wallet-multi-button.connected");
    return t("wallet.wallet-multi-button.no-wallet");
  }, [connecting, wallet, base58, locale]);

  const copyAddress = async () => {
    if (base58) {
      await navigator.clipboard.writeText(base58);
      setCopied(true);
      setTimeout(() => setCopied(false), 400);
      toast.success(t("wallet.wallet-multi-button.copy-success"));
    }
  };

  const openModal = () => {
    setVisible(true);
    setDropdownOpen(false);
  };

  const disconnectWallet = () => {
    disconnect();
    setDropdownOpen(false);
    toast.success(t("wallet.wallet-multi-button.disconnect-success"));
  };

  if (!wallet) {
    return (
      <Button onClick={openModal} className={className} {...props}>
        {content}
      </Button>
    );
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger
        render={
          <Button data-slot="dropdown-menu-trigger" className={cn("gap-2", className)} {...props} />
        }
      >
        {wallet.adapter.icon && (
          <WalletIcon
            wallet={{
              icon: wallet.adapter.icon,
              name: wallet.adapter.name,
            }}
          />
        )}
        {content}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {base58 && (
          <DropdownMenuItem onClick={copyAddress}>
            <Copy className="mr-2 h-4 w-4" />
            <span>
              {copied
                ? t("wallet.wallet-multi-button.copied")
                : t("wallet.wallet-multi-button.copy-address")}
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={openModal}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          <span>{t("wallet.wallet-multi-button.change-wallet")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnectWallet}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("wallet.wallet-multi-button.disconnect")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
