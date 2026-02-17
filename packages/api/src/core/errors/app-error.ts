export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "PRECONDITION_FAILED"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    public readonly i18nKey: string,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(i18nKey);
  }
}
