/**
 * Cheap, deterministic relevance matching between news articles and product
 * categories/groups — no schema change, no synonym list. A match requires the
 * category/group's exact name (as it already exists in the DB) to appear as a
 * literal substring of the article title. This is intentionally conservative:
 * it under-matches (an article saying "điều hòa" won't match category "Máy lạnh
 * treo tường") rather than risk showing an unrelated "related" link.
 *
 * Product/service names built from generic boilerplate ("Cung cấp lắp đặt các
 * dòng máy lạnh", "Thanh lý các dòng máy lạnh", ...) are deliberately excluded
 * from this matcher — their distinguishing text never appears verbatim in
 * article titles, and any attempt to strip the boilerplate collapses several
 * different services onto the same generic remainder, producing a "related"
 * list that's actually just duplicates.
 */

export interface NamedLink {
  name: string;
  slug: string;
}

function nameAppearsIn(name: string, title: string): boolean {
  return title.toLowerCase().includes(name.toLowerCase());
}

export function matchLinksByName<T extends NamedLink>(
  title: string,
  candidates: T[],
  limit: number,
): T[] {
  const seen = new Set<string>();
  const matches: T[] = [];
  for (const c of candidates) {
    if (matches.length >= limit) break;
    if (seen.has(c.slug)) continue;
    if (nameAppearsIn(c.name, title)) {
      matches.push(c);
      seen.add(c.slug);
    }
  }
  return matches;
}
