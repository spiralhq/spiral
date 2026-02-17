import type { Context as HonoContext } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { env } from "@spiral/env/server";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const token =
    getCookie(context, "session") || context.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return { session: null, hono: context };
  }

  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");
    return {
      session: {
        publicKey: payload.sub as string,
        organizationId: payload.organizationId as string,
        role: payload.role as number,
      },
      hono: context,
    };
  } catch {
    return { session: null, hono: context };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
