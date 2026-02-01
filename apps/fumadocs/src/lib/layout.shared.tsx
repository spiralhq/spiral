import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "@/assets/logo";
import { i18n } from "./i18n";

export function baseOptions(_locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: () => (
        <div className="mr-auto flex items-center space-x-2">
          <div className="size-8">
            <Logo />
          </div>
          <span className="font-semibold text-lg">Spiral</span>
        </div>
      ),
    },
  };
}
