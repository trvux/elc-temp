// Returns undefined (never fabricates "now") when updatedAt is missing or
// invalid — a wrong lastmod tells Google the page just changed when it
// didn't, eroding trust in the signal for the whole sitemap over time.
// Callers must omit the <lastmod> tag entirely when this returns undefined.
export function toSitemapLastmod(updatedAt: string | undefined | null): string | undefined {
  const date = updatedAt ? new Date(updatedAt) : null;
  return date && !isNaN(date.getTime()) ? date.toISOString() : undefined;
}
