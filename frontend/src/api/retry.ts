import { ApiError } from "./client";

/** One more try after a failure, but never after a refusal: a missing login or permission stays refused (AD-04). */
export function retryQuery(failures: number, error: unknown): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
  return failures < 1;
}
