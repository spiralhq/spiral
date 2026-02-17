"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import type { RouterOutputs } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/loader";

type UserSession = RouterOutputs["auth"]["getMe"];

type AuthContextType = {
  session: NonNullable<UserSession>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const {
    data: session,
    isLoading,
    isError,
  } = useQuery({
    ...trpc.auth.getMe.queryOptions(),
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!isLoading && (!session || isError)) {
      router.push("/login");
    }
  }, [isLoading, session, isError, router]);

  const value = useMemo(
    () => ({
      session: session!,
      isLoading,
    }),
    [session, isLoading],
  );

  if (isLoading || !session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
