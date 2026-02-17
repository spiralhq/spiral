import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "@/assets/logo";
import { i18n } from "./i18n";

export function baseOptions(_locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: () => (
        <div className="mr-auto flex items-center space-x-2">
          <Logo />
          <span className="text-xl font-bold tracking-tight text-foreground font-display">
            Spiral
          </span>
        </div>
      ),
    },
  };
}
