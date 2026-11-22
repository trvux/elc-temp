// Maps a public path to the internal /agent-md/* handler that renders its
// Markdown twin. Pure so it can be unit-tested; proxy.ts only calls it.

import redirectsMap from "@/shared/redirects-map.json";

export const MARKDOWN_SECTIONS = ["san-pham", "dich-vu", "du-an", "tin-tuc"] as const;

export interface MarkdownRoute {
  /** Internal handler path, e.g. `/agent-md/san-pham/abc`. */
  target: string;
  /** Path carried a `.md` suffix: serve Markdown regardless of Accept. */
  explicit: boolean;
}

const SLUG = /^[^/]+$/;

// First path segments that are NOT CMS pages. Any other single-segment `/<slug>` is served by
// app/(public)/[slug] (DB `pages` rows), so it gets a Markdown twin automatically. Everything
// here must keep its normal behaviour. The unit test walks app/ and public/ and FAILS when a
// top-level route exists that is neither listed here nor `[slug]`, so a new route is never
// silently hijacked by the catch-all.
export const RESERVED_FIRST_SEGMENTS: ReadonlySet<string> = new Set([
  // app routes and route groups: (admin) (auth) (fullscreen) (public)
  "admin", "login", "form", "magic-link", "co-so-ha-tang", "thong-tin",
  "san-pham", "dich-vu", "du-an", "tin-tuc",
  "api", "agent-md", "_next",
  // metadata / machine files
  "sitemap", "sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt",
  "favicon.ico", "icon.svg", "apple-icon.svg", "opengraph-image", "twitter-image",
  // public/ folders
  "images", "logo", "brands", "fonts", ".well-known",
  // English trust-anchor aliases (308 in next.config.ts + nginx); must redirect, not 404
  "about", "contact", "privacy",
  // `/index.md` is the home twin; `/index` itself is not a page
  "index",
]);

// Legacy single-segment slugs redirected by shared/proxy.ts (redirects-map.json) and the other
// single-segment next.config redirects: let them redirect instead of answering Markdown 404.
const LEGACY_REDIRECT_SLUGS: ReadonlySet<string> = new Set(
  Object.keys(redirectsMap as Record<string, string>)
    .filter((k) => k.split("/").length === 2)
    .map((k) => k.slice(1)),
);

/** True when `/<slug>` may be a CMS static page (not reserved, not a file, not a legacy redirect). */
export function isCmsPageSlug(slug: string): boolean {
  return (
    slug.length > 0 &&
    !slug.includes(".") &&
    !slug.startsWith("_") &&
    !RESERVED_FIRST_SEGMENTS.has(slug) &&
    !LEGACY_REDIRECT_SLUGS.has(slug)
  );
}

export function resolveMarkdownRoute(pathname: string): MarkdownRoute | null {
  let path = pathname;
  let explicit = false;
  if (path.endsWith(".md")) {
    path = path.slice(0, -3);
    explicit = true;
  }

  if (path === "/") return explicit ? null : { target: "/agent-md/home", explicit };
  if (explicit && path === "/index") return { target: "/agent-md/home", explicit };

  const parts = path.split("/");
  // ["", section] or ["", section, slug]
  if (parts[0] !== "" || parts.length < 2 || parts.length > 3) return null;
  const section = parts[1];
  // Information hub + branch pages (/thong-tin/<branch-slug>).
  if (section === "thong-tin") {
    if (parts.length === 2) return { target: "/agent-md/thong-tin", explicit };
    return SLUG.test(parts[2]) ? { target: `/agent-md/thong-tin/${parts[2]}`, explicit } : null;
  }
  if (parts.length === 2 && section === "form") return { target: "/agent-md/form", explicit };
  if (parts.length === 2 && isCmsPageSlug(section)) {
    return { target: `/agent-md/trang/${section}`, explicit };
  }
  if (!(MARKDOWN_SECTIONS as readonly string[]).includes(section)) return null;
  if (parts.length === 2) return { target: `/agent-md/${section}`, explicit };
  const slug = parts[2];
  if (!SLUG.test(slug)) return null;
  return { target: `/agent-md/${section}/${slug}`, explicit };
}
