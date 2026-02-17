import type { Context } from "hono";
import { toHttpException } from "../errors/to-http-exception";

export function handleHttp(
  fn: (c: Context) => Promise<Response>,
): (c: Context) => Promise<Response> {
  return async (c) => {
    try {
      return await fn(c);
    } catch (e) {
      throw toHttpException(e);
    }
  };
}
