"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import bs58 from "bs58";
import { Loader2, ArrowRight, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "../auth-layout";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@/features/wallet/components/wallet-multi-button").then((m) => m.WalletMultiButton),
  { ssr: false },
);

export function AuthForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? undefined;

  const { publicKey, signMessage, connected } = useWallet();

  const challengeMutation = useMutation(trpc.auth.requestChallenge.mutationOptions());
  const verifyMutation = useMutation(trpc.auth.verify.mutationOptions());

  const authMutation = useMutation({
    mutationKey: ["auth", "siws", inviteToken],
    mutationFn: async () => {
      if (!publicKey || !signMessage) {
        throw { data: { i18nKey: "errors.unknown" } };
      }

      const { message, nonce } = await challengeMutation.mutateAsync({
        publicKey: publicKey.toBase58(),
      });

      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encodedMessage);
      const signature = bs58.encode(signatureBytes);

      await verifyMutation.mutateAsync({
        publicKey: publicKey.toBase58(),
        signature,
        nonce,
        inviteToken,
      });

      return true;
    },
    onSuccess: () => {
      toast.success(t(inviteToken ? "auth.invite.success" : "auth.sign-in.success"));
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error: any) => {
      const i18nKey = error?.data?.i18nKey;
      toast.error(t(i18nKey ?? "errors.unknown"));
    },
  });

  const handleAuth = () => authMutation.mutate();

  return (
    <AuthLayout>
      <motion.div
        className="w-full max-w-sm mx-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="space-y-3 mb-10">
          <motion.h1
            className="text-3xl font-bold tracking-tight text-foreground font-display"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {t("auth.sign-in.title")}
          </motion.h1>
          <motion.p
            className="text-sm text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {t(inviteToken ? "auth.invite.description" : "auth.sign-in.description")}
          </motion.p>
        </div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <WalletMultiButton className="w-full" variant={connected ? "outline" : "default"} />
          {connected && (
            <Button
              onClick={handleAuth}
              disabled={authMutation.isPending || !publicKey || !signMessage}
              className="w-full"
              size="lg"
            >
              {authMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  {inviteToken ? t("auth.invite.action") : t("auth.sign-in.action")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}

          <div className="flex items-center justify-center gap-2 pt-2">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t("auth.sign-in.wallet-options")}</p>
          </div>

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              {t("auth.sign-in.divider")}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            Solana Identity Verification (SIWS)
          </p>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}
