"use server";

import type { ContentVariableRequest } from "@/shared/lib/content-variables";

const GO_API_URL = process.env.GO_API_URL;

/**
 * Batch-resolves content-variable placeholders (product count / price
 * range for a group/category/brand scope) against the live catalog in one
 * round trip. Cached 30 min via Next's fetch cache — these numbers don't
 * need to be live-exact on every request, just fresh enough that Google
 * never crawls a stale one for long. Read-only POST on the Go side (see
 * elc-go internal/contentvar), so no auth header needed.
 */
export async function resolveContentVariablesAction(
  requests: ContentVariableRequest[],
): Promise<Record<string, number>> {
  if (!GO_API_URL || requests.length === 0) return {};

  try {
    const res = await fetch(`${GO_API_URL}/content-variables/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variables: requests.map((req) => ({
          id: req.id,
          metric: req.metric,
          filter: {
            groupSlug: req.filter.groupSlug ?? "",
            categorySlug: req.filter.categorySlug ?? "",
            brandSlug: req.filter.brandSlug ?? "",
          },
        })),
      }),
      next: { revalidate: 1800 },
    });
    if (!res.ok) return {};

    const body = (await res.json()) as { values?: Record<string, number> };
    return body.values ?? {};
  } catch (error) {
    console.error("resolveContentVariablesAction error:", error);
    return {};
  }
}
