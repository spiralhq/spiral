"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Languages, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { setLocale } from "@/app/actions/set-locale";
import { LOCALES, type Locale } from "@/constants/locales";

interface LocaleSelectorProps {
  withLabel?: boolean;
}

export function LocaleSelector({ withLabel = false }: LocaleSelectorProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const [pending, startTransition] = React.useTransition();

  const currentLabel = LOCALES.find((l) => l.value === locale)?.label;

  function onSelect(nextLocale: Locale) {
    if (nextLocale === locale) return;

    startTransition(async () => {
      await setLocale(nextLocale);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size={withLabel ? "default" : "icon"} disabled={pending}>
            <div className="flex items-center gap-2">
              <Languages className="h-[1.2rem] w-[1.2rem]" />
              {withLabel && <span>{currentLabel}</span>}
            </div>
            {withLabel && <ChevronDown className="h-4 w-4 opacity-50" />}
            {!withLabel && <span className="sr-only">{t("common.locale-selector.sr-only")}</span>}
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="min-w-45">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => onSelect(l.value)}
            className="flex items-center justify-between"
          >
            <span>{l.label}</span>
            {l.value === locale && <CheckIcon className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
