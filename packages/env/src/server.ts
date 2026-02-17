import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    JWT_SECRET: z.string().min(1),
    SOLANA_RPC_URL: z.string().min(1),
    ORGANIZATION_PROGRAM_ID: z.string().min(1),
    DEFAULT_ORG_PDA: z.string().optional(),
    ADMIN_PUBLIC_KEY: z.string().optional(),
    ADMIN_MEMBERSHIP_PDA: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  clientPrefix: "",
  client: {},
});
