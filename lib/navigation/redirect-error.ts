/**
 * Next.js `redirect()` throws a special error that must propagate out of server
 * action try/catch blocks. Prefer checking `digest` (stable) over `message`.
 */
export function isNextRedirectError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const digest = (error as Error & { digest?: string }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function rethrowIfNextRedirect(error: unknown): void {
  if (isNextRedirectError(error)) {
    throw error;
  }
}
