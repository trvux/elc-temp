/**
 * Server actions calling the Go API return `{ data, error }` instead of
 * throwing, so a real fetch failure and a legitimately empty result both
 * look like `{ data: [] }` to the caller. Inside a `"use cache"` function
 * that distinction matters: throwing preserves the last good cache entry
 * (stale-if-error) while returning empty data overwrites it with a false
 * "there's really nothing here" result. Route errors through this so genuine
 * failures throw and empty-but-successful results pass through untouched.
 */
export function unwrapActionResult<T>(result: { data: T; error: string | null }): T {
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data;
}
