import { toTrpcError } from "../errors/to-trpc-error";

export async function trpcTry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw toTrpcError(e);
  }
}
