"use client";

import { Header } from "@/components/layout/header";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Main } from "@/components/layout/main";
import { LocaleSelector } from "@/components/locale-selector";

export default function Dashboard() {
  return (
    <>
      <Header>
        <Search />
        <span className="flex items-center gap-2">
          <LocaleSelector />
          <ThemeSwitch />
        </span>
      </Header>
      <Main>
        <div className="flex flex-col gap-4 py-4 px-4 md:py-6">
          <h1>Dashboard</h1>
        </div>
      </Main>
    </>
  );
}
