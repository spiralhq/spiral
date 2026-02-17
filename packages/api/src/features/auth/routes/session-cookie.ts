import type { CookieOptions } from "hono/utils/cookie";
import { env } from "@spiral/env/server";

export const SESSION_COOKIE_NAME = "session" as const;

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}
