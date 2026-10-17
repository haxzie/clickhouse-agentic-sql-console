/** Unwraps a caught value into a message, falling back when it is not an Error. */
export function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}
