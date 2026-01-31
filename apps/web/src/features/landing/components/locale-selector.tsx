"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Globe, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { setLocale } from "@/app/actions/set-locale";

type Locale = "en" | "pt-BR";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "pt-BR", label: "Português (BR)" },
];

interface LocaleSelectorProps {
  isMobile?: boolean;
}

export function LocaleSelector({ isMobile = false }: LocaleSelectorProps) {
  const t = useTranslations("Common.LocaleSelector");
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
          <Button variant="outline" size={isMobile ? "default" : "icon"} disabled={pending}>
            <div className="flex items-center gap-2">
              <Globe className="h-[1.2rem] w-[1.2rem]" />
              {isMobile && <span>{currentLabel}</span>}
            </div>
            {isMobile && <ChevronDown className="h-4 w-4 opacity-50" />}
            {!isMobile && <span className="sr-only">{t("sr-only")}</span>}
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
