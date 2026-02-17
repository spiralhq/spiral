"use client";

import { ChevronsUpDown, LogOut, Shield, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { useAuth } from "@/context/auth-provider";
import useDialogState from "@/hooks/use-dialog-state";
import { useTranslations } from "next-intl";

export function NavUser() {
  const t = useTranslations();
  const { isMobile } = useSidebar();
  const { session } = useAuth();
  const [open, setOpen] = useDialogState();

  const truncateKey = (key: string) => `${key.slice(0, 4)}...${key.slice(-4)}`;
  const displayName = session.name || "Anonymous User";
  const displayAddress = truncateKey(session.publicKey);

  return (
    <>
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
              <Avatar className="h-8 w-8 rounded-lg after:rounded-lg grayscale">
                <AvatarFallback className="bg-primary/10 text-primary/80 rounded-lg">
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs font-mono text-muted-foreground">
                  {displayAddress}
                </span>
              </div>
              <ChevronsUpDown className="ms-auto size-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                    <Avatar className="h-8 w-8 rounded-lg after:rounded-lg grayscale">
                      <AvatarFallback className="bg-primary/10 text-primary/80 rounded-lg">
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-start text-sm leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs font-mono">{displayAddress}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-2">
                  <Shield className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("sidebar.nav-user.active-role")}
                    </span>
                    <span>{session.role === 1 ? "Administrator" : "Preservador"}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setOpen(true)}>
                <LogOut className="h-4 w-4" />
                {t("auth.sign-out.action")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  );
}
