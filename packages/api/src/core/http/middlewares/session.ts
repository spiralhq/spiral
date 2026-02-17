import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createContext } from "../../context";
import type { HttpAppEnv } from "../types";
import { AppError } from "../../errors/app-error";
import { toHttpException } from "../../errors/to-http-exception";

export const sessionMiddleware = createMiddleware<HttpAppEnv>(async (c, next) => {
  const ctx = await createContext({ context: c });

  c.set("session", ctx.session);
  await next();
});

export const requireSession = createMiddleware<HttpAppEnv>(async (c, next) => {
  const ctx = await createContext({ context: c });
  c.set("session", ctx.session);

  if (!ctx.session) {
    throw toHttpException(new AppError("UNAUTHORIZED", "errors.auth.required"));
  }

  await next();
});

export function getSessionOrThrow(c: { var: { session: HttpAppEnv["Variables"]["session"] } }) {
  if (!c.var.session) {
    throw new HTTPException(401);
  }
  return c.var.session;
}
