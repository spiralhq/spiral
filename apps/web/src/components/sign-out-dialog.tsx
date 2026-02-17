"use client";

import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { cn } from "@/lib/utils";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const t = useTranslations();
  const router = useRouter();
  const logoutMutation = useMutation(trpc.auth.logout.mutationOptions());

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success(t("auth.sign-out.success"));

      router.push("/login");
      router.refresh();
    } catch (error: any) {
      const i18nKey = error?.data?.i18nKey;
      toast.error(t(i18nKey ?? "errors.unknown"));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("auth.sign-out.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("auth.sign-out.description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("auth.sign-out.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {t("auth.sign-out.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
