/**
 * Server actions calling the Go API return `{ data, error }` instead of
 * throwing, so a real fetch failure and a legitimately empty result both
 * look like `{ data: [] }` to the caller. Route errors through this so
 * genuine failures throw and empty-but-successful results pass through
 * untouched, instead of the two being silently indistinguishable.
 */
export function unwrapActionResult<T>(result: { data: T; error: string | null }): T {
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data;
}
