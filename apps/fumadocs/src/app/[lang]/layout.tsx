import { RootProvider } from "fumadocs-ui/provider/next";
import "katex/dist/katex.css";
import "../global.css";
import { defineI18nUI } from "fumadocs-ui/i18n";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { i18n } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
});

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: "English",
    },
    ptBR: {
      displayName: "Português (Brasil)",
      search: "Procurar",
      searchNoResult: "Nenhum resultado encontrado",
      toc: "Sumário",
      tocNoHeadings: "Esta página não possui títulos",
      lastUpdate: "Última atualização",
      chooseLanguage: "Escolha o idioma",
      nextPage: "Próxima página",
      previousPage: "Página anterior",
      chooseTheme: "Escolha o tema",
      editOnGithub: "Editar no GitHub",
    },
  },
});

export const metadata: Metadata = {
  title: "Spiral Docs",
  description:
    "Documentation for Spiral - Building public infrastructure for the preservation of human audiovisual memory.",
};

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const lang = (await params).lang;

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider i18n={provider(lang)}>{children}</RootProvider>
      </body>
    </html>
  );
}
