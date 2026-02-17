"use client";

import { LocaleSelector } from "@/components/locale-selector";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { CornerUpLeft } from "lucide-react";
import Link from "next/link";
import { AuthBanner } from "./components/auth-banner";
import { Logo } from "@/assets/logo";
import { useTranslations } from "next-intl";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const t = useTranslations();

  return (
    <main className="flex min-h-screen">
      <section className="hidden lg:flex lg:w-[50%] min-h-screen border-r border-border">
        <AuthBanner />
      </section>

      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 bg-card dark:bg-background">
        <div className="absolute top-4 left-4 z-20">
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
            <CornerUpLeft />
            {t("landing.navbar.home")}
          </Button>
        </div>

        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-2">
            <LocaleSelector />
            <ThemeSwitch />
          </div>
        </div>

        <div className="mb-4 flex gap-2 lg:hidden items-center justify-center">
          <Logo />
          <h1 className="text-xl font-bold tracking-tight text-foreground font-display">Spiral</h1>
        </div>
        {children}
      </section>
    </main>
  );
}
