import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useTranslations } from "next-intl";

interface WalletListItemProps {
  wallet: Wallet;
  handleClick: () => void;
}

export function WalletListItem({ wallet, handleClick }: WalletListItemProps) {
  const t = useTranslations();
  return (
    <Button
      variant="ghost"
      size="lg"
      className="w-full justify-between gap-4 first:mt-2 last:mb-2"
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <Image
          src={wallet.adapter.icon || "/placeholder.svg"}
          alt={`${wallet.adapter.name} icon`}
          width={24}
          height={24}
        />
        <span className="text-lg font-semibold">{wallet.adapter.name}</span>
      </div>
      {wallet.readyState === WalletReadyState.Installed && (
        <span className="text-sm text-muted-foreground">
          {t("wallet.wallet-list-item.detected")}
        </span>
      )}
    </Button>
  );
}
