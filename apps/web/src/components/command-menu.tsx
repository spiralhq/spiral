import React from "react";
import { ArrowRight, ChevronRight, Languages, Laptop, Moon, Sun } from "lucide-react";
import { useSearch } from "@/context/search-provider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getSidebarData } from "./layout/data/sidebar-data";
import { ScrollArea } from "./ui/scroll-area";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, type Locale } from "@/constants/locales";
import { setLocale } from "@/app/actions/set-locale";

export function CommandMenu() {
  const t = useTranslations();
  const sidebarData = getSidebarData(t);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { open, setOpen } = useSearch();
  const locale = useLocale() as Locale;

  async function handleLocaleChange(nextLocale: Locale) {
    if (nextLocale === locale) return;

    await setLocale(nextLocale);
    router.refresh();
  }

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    [setOpen],
  );

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder={t("common.command-menu.placeholder")} />
        <CommandList>
          <ScrollArea className="h-72 pe-1">
            <CommandEmpty>{t("common.command-menu.no-results")}</CommandEmpty>
            {sidebarData.navGroups.map((group) => (
              <CommandGroup key={group.title} heading={group.title}>
                {group.items.map((navItem, i) => {
                  if (navItem.url)
                    return (
                      <CommandItem
                        key={`${navItem.url}-${i}`}
                        value={navItem.title}
                        onSelect={() => {
                          runCommand(() => router.push(navItem.url!));
                        }}
                      >
                        <div className="flex size-4 items-center justify-center">
                          <ArrowRight className="text-muted-foreground/80 size-2" />
                        </div>
                        {navItem.title}
                      </CommandItem>
                    );

                  return navItem.items?.map((subItem, i) => (
                    <CommandItem
                      key={`${navItem.title}-${subItem.url}-${i}`}
                      value={`${navItem.title}-${subItem.url}`}
                      onSelect={() => {
                        runCommand(() => router.push(subItem.url!));
                      }}
                    >
                      <div className="flex size-4 items-center justify-center">
                        <ArrowRight className="text-muted-foreground/80 size-2" />
                      </div>
                      {navItem.title} <ChevronRight /> {subItem.title}
                    </CommandItem>
                  ));
                })}
              </CommandGroup>
            ))}
            <CommandSeparator />
            <CommandGroup heading={t("common.command-menu.locale")}>
              {LOCALES.map((localeOption) => (
                <CommandItem
                  key={localeOption.value}
                  onSelect={() => handleLocaleChange(localeOption.value)}
                >
                  <Languages className="me-2" />
                  {localeOption.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading={t("common.command-menu.theme")}>
              <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                <Sun /> <span>{t("common.theme-switch.light")}</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                <Moon className="scale-90" />
                <span>{t("common.theme-switch.dark")}</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                <Laptop />
                <span>{t("common.theme-switch.system")}</span>
              </CommandItem>
            </CommandGroup>
          </ScrollArea>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
