// Shared image-with-metadata shape — matches schema.org's ImageObject
// (caption) and how Shopify/WordPress model gallery images ({url, alt,
// caption}) instead of a bare URL string. Every module that stores a
// gallery (catalog/project/service/branch/news) uses this same shape, and
// every consumer should go through the helpers below rather than reaching
// into `.images[0]`/`.image` directly — that scattering (50+ ad-hoc read
// sites) is exactly what made the old plain-string-array shape expensive to
// change once.
export interface ImageAsset {
  url: string;
  alt?: string;
  caption?: string;
}

// primaryImageUrl returns the cover image URL, or "" if there are none —
// the single most common thing every card/detail page/OG-image/JSON-LD
// consumer needs.
export function primaryImageUrl(images: ImageAsset[] | undefined | null): string {
  return images?.[0]?.url ?? "";
}

// imageUrls flattens to a plain URL array — for consumers that only ever
// needed URLs (e.g. sitemap <image:loc> entries).
export function imageUrls(images: ImageAsset[] | undefined | null): string[] {
  return (images ?? []).map((img) => img.url);
}
