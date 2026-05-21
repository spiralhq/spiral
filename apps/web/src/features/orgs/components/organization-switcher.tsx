"use client";

import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Logo } from "@/assets/logo";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const t = useTranslations();

  const { data: organizations } = useQuery(trpc.orgs.listMine.queryOptions());
  const switchMutation = useMutation(trpc.orgs.switch.mutationOptions());

  const activeTeam = organizations?.find((team) => team.isActive) || organizations?.[0];

  const handleSwitch = async (teamId: string) => {
    try {
      if (activeTeam?.id === teamId) return;

      await switchMutation.mutateAsync({ organizationId: teamId });
      router.refresh();
    } catch (error: any) {
      const i18nKey = error?.data?.i18nKey;
      toast.error(t(i18nKey ?? "errors.unknown"));
    }
  };

  if (!organizations || organizations.length === 0 || !activeTeam) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Logo className="size-4" />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Spiral</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Logo className="size-4 text-primary-foreground fill-current" />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeTeam.name}</span>
              <span className="truncate text-xs">{activeTeam.slug}</span>
            </div>

            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {t("orgs.organization-switcher.title")}
            </div>

            {organizations.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleSwitch(team.id)}
                className="cursor-pointer gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Logo className="size-3.5 shrink-0" />
                </div>

                <span className="flex-1 truncate">{team.name}</span>

                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>

              <div className="font-medium text-muted-foreground">
                {t("orgs.organization-switcher.create-new")}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
