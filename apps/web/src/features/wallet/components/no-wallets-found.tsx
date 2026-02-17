import { useTranslations } from "next-intl";

export function NoWalletsFound() {
  const t = useTranslations();
  return (
    <div className="text-center p-6">
      <h2 className="text-lg font-semibold">{t("wallet.no-wallets-found.title")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("wallet.no-wallets-found.description")}
      </p>
    </div>
  );
}
