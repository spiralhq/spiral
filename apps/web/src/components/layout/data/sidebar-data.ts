import { LayoutDashboard } from "lucide-react";
import { type SidebarData } from "../types";
import type { useTranslations } from "next-intl";

type T = ReturnType<typeof useTranslations>;

export function getSidebarData(t: T): SidebarData {
  return {
    navGroups: [
      {
        title: t("sidebar.general.title"),
        items: [
          {
            title: t("sidebar.general.dashboard"),
            url: "/dashboard",
            icon: LayoutDashboard,
          },
        ],
      },
    ],
  };
}
