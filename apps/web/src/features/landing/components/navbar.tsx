"use client";

import { Github01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/assets/logo";
import { LocaleSelector } from "./locale-selector";
import { useTranslations } from "next-intl";
import { env } from "@spiral/env/web";

const SCROLL_OFFSET = 100;
const DOCS_URL = env.NEXT_PUBLIC_DOCS_URL;
const GITHUB_URL = env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/spiralhq/spiral";

type NavItem =
  | { label: string; type: "scroll"; id: string }
  | { label: string; type: "external"; href: string };

function useNavItems() {
  const t = useTranslations("Landing.Navbar");
  return useMemo<NavItem[]>(() => {
    const docsItem: NavItem | null = DOCS_URL
      ? { label: t("docs"), type: "external", href: DOCS_URL }
      : null;

    return [{ label: t("home"), type: "scroll", id: "hero" }, ...(docsItem ? [docsItem] : [])];
  }, [t, DOCS_URL]);
}

function useSmoothScroll() {
  return useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const elementPosition = element.offsetTop - SCROLL_OFFSET;

    window.scrollTo({
      top: elementPosition,
      behavior: "smooth",
    });
  }, []);
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const items = useNavItems();
  const scrollTo = useSmoothScroll();

  const handleLinkClick = (id: string) => {
    scrollTo(id);
    setIsOpen(false);
  };

  return (
    <motion.header
      className="fixed top-6 left-1/2 z-50 w-full max-w-4xl -translate-x-1/2 px-4"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="rounded-2xl border border-border bg-background/80 px-6 py-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between">
          <LogoSection />

          <DesktopNav items={items} onScroll={scrollTo} />

          <DesktopActions />

          <MobileMenu
            items={items}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            onScroll={handleLinkClick}
          />
        </div>
      </div>
    </motion.header>
  );
}

function LogoSection() {
  return (
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="h-8 w-8 shrink-0 text-primary">
        <Logo />
      </div>
      <span className="hidden text-lg font-bold tracking-tight sm:inline-block">Spiral</span>
    </motion.div>
  );
}

function DesktopNav({ items, onScroll }: { items: NavItem[]; onScroll: (id: string) => void }) {
  return (
    <nav className="hidden items-center gap-8 md:flex">
      {items.map((item, index) => (
        <NavLink key={item.label} item={item} index={index} onScroll={onScroll} />
      ))}
    </nav>
  );
}

function DesktopActions() {
  return (
    <div className="hidden items-center gap-2 md:flex">
      <div className="flex items-center gap-1">
        <ThemeSwitch />
        <LocaleSelector />
      </div>
      <Separator orientation="vertical" />
      <GitHubLink />
    </div>
  );
}

interface MobileMenuProps {
  items: NavItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onScroll: (id: string) => void;
}

function MobileMenu({ items, isOpen, setIsOpen, onScroll }: MobileMenuProps) {
  return (
    <div className="flex items-center gap-2 md:hidden">
      <ThemeSwitch />

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger
          render={
            <Button size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          }
        />

        <SheetContent side="right" className="flex w-75 flex-col p-6 sm:w-87.5">
          <SheetHeader className="mb-6 border-b pb-4">
            <SheetTitle className="flex items-center gap-2">
              <span className="h-8 w-8 text-primary">
                <Logo />
              </span>
              <span className="font-bold">Spiral</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col justify-between">
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <MobileNavLink
                  key={item.label}
                  item={item}
                  index={i}
                  onClick={() => (item.type === "scroll" ? onScroll(item.id) : setIsOpen(false))}
                />
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t pt-6">
              <GitHubLink isMobile />
              <LocaleSelector isMobile />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function GitHubLink({ isMobile = false }: { isMobile?: boolean }) {
  const t = useTranslations("Landing.Navbar");

  if (isMobile) {
    return (
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("githubStar")}
        className={cn(buttonVariants({ variant: "default" }), "w-full justify-center gap-2")}
      >
        <HugeiconsIcon icon={Github01Icon} className="size-5" />
        <span>{t("githubStar")}</span>
      </a>
    );
  }

  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("githubStar")}
      className={cn(buttonVariants({ size: "icon" }))}
    >
      <HugeiconsIcon icon={Github01Icon} className="size-5" />
    </a>
  );
}

interface LinkProps {
  item: NavItem;
  index: number;
  onClick?: () => void;
  onScroll?: (id: string) => void;
}

function NavLink({ item, index, onScroll }: LinkProps) {
  const commonClasses =
    "cursor-pointer text-sm font-medium text-foreground/80 hover:text-foreground transition-colors relative group flex items-center";

  const underline = (
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
  );

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
      {item.type === "scroll" ? (
        <button
          type="button"
          onClick={() => onScroll?.(item.id)}
          className={commonClasses}
          aria-label={item.label}
        >
          {item.label}
          {underline}
        </button>
      ) : (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={commonClasses}
          aria-label={item.label}
        >
          {item.label}
          {underline}
        </a>
      )}
    </motion.div>
  );
}

function MobileNavLink({ item, index, onClick }: LinkProps) {
  const commonClasses =
    "block w-full text-left text-lg font-medium text-foreground hover:text-primary transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.1 }}
    >
      {item.type === "scroll" ? (
        <button type="button" className={commonClasses} onClick={onClick} aria-label={item.label}>
          {item.label}
        </button>
      ) : (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={commonClasses}
          onClick={onClick}
          aria-label={item.label}
        >
          {item.label}
        </a>
      )}
    </motion.div>
  );
}
