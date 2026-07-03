export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/**
 * Builds a relative `?...` href for a given page, preserving every other search
 * param (filters, search query, etc). Page 1 omits the `page` param entirely so
 * the canonical listing URL stays clean.
 */
export function buildPageHref(searchParams: SearchParamsRecord, page: number): string {
  const sp = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, v));
    } else {
      sp.append(key, value);
    }
  }

  if (page > 1) sp.set("page", String(page));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
