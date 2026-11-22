// Maps a public path to the internal /agent-md/* handler that renders its
// Markdown twin. Pure so it can be unit-tested; proxy.ts only calls it.

export const MARKDOWN_SECTIONS = ["san-pham", "dich-vu", "du-an", "tin-tuc"] as const;

export interface MarkdownRoute {
  /** Internal handler path, e.g. `/agent-md/san-pham/abc`. */
  target: string;
  /** Path carried a `.md` suffix: serve Markdown regardless of Accept. */
  explicit: boolean;
}

const SLUG = /^[^/]+$/;

// Top-level static pages (DB `pages` rows rendered by app/(public)/[slug]). The
// route is a catch-all slug, so only these verified slugs are rewritten; anything
// else (/form, /login, /api, unknown) must keep its normal HTML behaviour.
export const STATIC_PAGE_SLUGS = [
  "gioi-thieu-ve-dien-may-elc",
  "chinh-sach-thu-thap-va-xu-ly-du-lieu-ca-nhan",
  "chinh-sach-bao-hanh-san-pham",
  "chinh-sach-doi-tra-va-hoan-tien",
  "quy-trinh-thi-cong-lap-dat-may-lanh-chuan-ky-thuat-tai-dien-may-elc",
] as const;

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
  if (parts.length === 2 && (STATIC_PAGE_SLUGS as readonly string[]).includes(section)) {
    return { target: `/agent-md/trang/${section}`, explicit };
  }
  if (!(MARKDOWN_SECTIONS as readonly string[]).includes(section)) return null;
  if (parts.length === 2) return { target: `/agent-md/${section}`, explicit };
  const slug = parts[2];
  if (!SLUG.test(slug)) return null;
  return { target: `/agent-md/${section}/${slug}`, explicit };
}
