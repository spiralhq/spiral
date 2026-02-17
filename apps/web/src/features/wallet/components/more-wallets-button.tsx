import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface MoreWalletsButtonProps {
  expanded: boolean;
  onClick: () => void;
}

export function MoreWalletsButton({ expanded, onClick }: MoreWalletsButtonProps) {
  const t = useTranslations();
  return (
    <Button variant="outline" className="w-full my-2" onClick={onClick}>
      <span>
        {expanded ? t("wallet.more-wallets-button-less") : t("wallet.more-wallets-button-more")}
      </span>
      {expanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
    </Button>
  );
}
