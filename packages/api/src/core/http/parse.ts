import type { Context } from "hono";
import type { ZodSchema, z } from "zod";
import { AppError } from "../errors/app-error";

export async function parseJson<T extends ZodSchema>(c: Context, schema: T): Promise<z.infer<T>> {
  let json: unknown;

  try {
    json = await c.req.json();
  } catch {
    throw new AppError("BAD_REQUEST", "errors.http.invalid-json");
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new AppError("BAD_REQUEST", "errors.http.invalid-body", {
      issues: result.error.issues,
    });
  }

  return result.data;
}
