import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { RESERVED_FIRST_SEGMENTS, resolveMarkdownRoute } from "@/shared/lib/agent-markdown/routes";
import {
  buildFrontmatter,
  buildInquirySection,
  markdownHeaders,
  MARKDOWN_HEADERS,
  TRUST_PAGES,
} from "@/shared/lib/agent-markdown/render";
import { BASE_URL } from "@/shared/lib/seo-schema";

describe("resolveMarkdownRoute", () => {
  it.each(["san-pham", "dich-vu", "du-an", "tin-tuc"])("maps %s index and slug", (s) => {
    expect(resolveMarkdownRoute(`/${s}`)).toEqual({ target: `/agent-md/${s}`, explicit: false });
    expect(resolveMarkdownRoute(`/${s}/abc`)).toEqual({ target: `/agent-md/${s}/abc`, explicit: false });
  });
  it("maps home", () => {
    expect(resolveMarkdownRoute("/")).toEqual({ target: "/agent-md/home", explicit: false });
  });
  it("handles .md suffix as explicit", () => {
    expect(resolveMarkdownRoute("/san-pham/xyz.md")).toEqual({ target: "/agent-md/san-pham/xyz", explicit: true });
    expect(resolveMarkdownRoute("/tin-tuc.md")).toEqual({ target: "/agent-md/tin-tuc", explicit: true });
    expect(resolveMarkdownRoute("/index.md")).toEqual({ target: "/agent-md/home", explicit: true });
  });
  it("returns null for nested, unknown and malformed paths", () => {
    for (const p of ["/san-pham/a/b", "/agent-md/home", "/index", "/.md", "/san-pham/.md", "/san-pham/", "/admin"]) {
      expect(resolveMarkdownRoute(p), p).toBeNull();
    }
  });
});

describe("resolveMarkdownRoute static/trust pages", () => {
  it("maps thong-tin hub and branch slug", () => {
    expect(resolveMarkdownRoute("/thong-tin")).toEqual({ target: "/agent-md/thong-tin", explicit: false });
    expect(resolveMarkdownRoute("/thong-tin.md")).toEqual({ target: "/agent-md/thong-tin", explicit: true });
    expect(resolveMarkdownRoute("/thong-tin/van-phong")).toEqual({ target: "/agent-md/thong-tin/van-phong", explicit: false });
    expect(resolveMarkdownRoute("/thong-tin/van-phong.md")).toEqual({ target: "/agent-md/thong-tin/van-phong", explicit: true });
    expect(resolveMarkdownRoute("/thong-tin/a/b")).toBeNull();
  });
  it.each([
    "gioi-thieu-ve-dien-may-elc",
    "chinh-sach-bao-hanh-san-pham",
    "a-brand-new-admin-page",
  ])("maps CMS page %s (also unknown slugs)", (slug) => {
    expect(resolveMarkdownRoute(`/${slug}`)).toEqual({ target: `/agent-md/trang/${slug}`, explicit: false });
    expect(resolveMarkdownRoute(`/${slug}.md`)).toEqual({ target: `/agent-md/trang/${slug}`, explicit: true });
  });
  it("does not hijack reserved or file-like top-level routes", () => {
    const paths = [...RESERVED_FIRST_SEGMENTS].filter((s) => s !== "form").flatMap((s) => [`/${s}`, `/${s}.md`]);
    paths.push("/robots.txt", "/opengraph-image.png", "/5526e838bca84144ad7c1a84f3eb7d82.txt", "/_next", "/gioi-thieu-ve-dien-may-elc/x");
    for (const p of paths) {
      const r = resolveMarkdownRoute(p);
      // thong-tin and the 4 sections intentionally have their own Markdown handlers
      expect(r === null || !r.target.startsWith("/agent-md/trang/"), p).toBe(true);
    }
    expect(resolveMarkdownRoute("/form")).toEqual({ target: "/agent-md/form", explicit: false });
    expect(resolveMarkdownRoute("/form.md")).toEqual({ target: "/agent-md/form", explicit: true });
    for (const p of ["/login", "/magic-link", "/api", "/admin", "/about", "/about.md", "/contact", "/privacy", "/co-so-ha-tang", "/chi-nhanh"]) {
      expect(resolveMarkdownRoute(p), p).toBeNull();
    }
  });
});

// Guard: the catch-all `[slug]` swallows every top-level path, so a new app/ route must be
// reserved explicitly or Markdown negotiation would rewrite it to a "page not found".
describe("reserved first segments vs the real app/ tree", () => {
  const root = process.cwd();
  const NON_ROUTE = new Set([
    "layout.tsx", "page.tsx", "error.tsx", "not-found.tsx", "loading.tsx", "global-error.tsx",
    "template.tsx", "default.tsx", "globals.css", "typeset.css", "proxy.ts",
  ]);
  function topLevel(dir: string): string[] {
    const out: string[] = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith("(") && e.isDirectory()) {
        out.push(...topLevel(join(dir, e.name)));
      } else if (!e.isDirectory() && NON_ROUTE.has(e.name)) {
        continue;
      } else if (e.name.startsWith("_") || e.name.endsWith(".alt.txt")) {
        continue; // private folders / metadata alt text
      } else {
        out.push(e.name);
      }
    }
    return out;
  }
  const known = (name: string) => {
    if (RESERVED_FIRST_SEGMENTS.has(name)) return true;
    const stem = name.replace(/\.[^.]+$/, "");
    // robots.ts -> /robots.txt, sitemap.ts -> /sitemap.xml, opengraph-image.png -> /opengraph-image
    return RESERVED_FIRST_SEGMENTS.has(stem) || RESERVED_FIRST_SEGMENTS.has(`${stem}.txt`) || RESERVED_FIRST_SEGMENTS.has(`${stem}.xml`);
  };

  it("every top-level app/ route is reserved or the [slug] catch-all", () => {
    const unknown = topLevel(join(root, "app")).filter((n) => n !== "[slug]" && !known(n));
    expect(unknown, `Add to RESERVED_FIRST_SEGMENTS in routes.ts: ${unknown.join(", ")}`).toEqual([]);
  });
  it("only [slug] is a dynamic top-level segment", () => {
    const dyn = topLevel(join(root, "app")).filter((n) => n.startsWith("["));
    expect(dyn).toEqual(["[slug]"]);
  });
  it("every public/ folder is reserved", () => {
    const dirs = readdirSync(join(root, "public"), { withFileTypes: true }).filter((e) => e.isDirectory());
    expect(dirs.map((d) => d.name).filter((n) => !RESERVED_FIRST_SEGMENTS.has(n))).toEqual([]);
  });
  it("reserves the real route folders explicitly", () => {
    for (const s of ["admin", "login", "form", "magic-link", "co-so-ha-tang", "api", "agent-md", "thong-tin"]) {
      expect(RESERVED_FIRST_SEGMENTS.has(s), s).toBe(true);
    }
  });
});

describe("markdownHeaders", () => {
  it("extends MARKDOWN_HEADERS with noindex and canonical", () => {
    const h = markdownHeaders("/san-pham/x");
    expect(h).toMatchObject(MARKDOWN_HEADERS);
    expect(h["X-Robots-Tag"]).toBe("noindex");
    expect(h.Link).toBe(`<${BASE_URL}/san-pham/x>; rel="canonical"`);
  });
  it("keeps MARKDOWN_HEADERS free of noindex (410 route)", () => {
    expect(MARKDOWN_HEADERS).not.toHaveProperty("X-Robots-Tag");
  });
});

describe("buildFrontmatter / buildInquirySection", () => {
  it("emits YAML frontmatter", () => {
    const fm = buildFrontmatter({ title: 'A "b"', description: "d\ne", canonicalUrl: "https://x/y", updatedAt: "2026-01-01" });
    expect(fm).toBe('---\ntitle: "A \\"b\\""\ndescription: "d e"\ncanonical: https://x/y\nupdated: 2026-01-01\n---\n');
  });
  it("points to contact page and form, no purchase wording", () => {
    const s = buildInquirySection();
    expect(s).toContain("## Yêu cầu báo giá");
    expect(s).toContain(TRUST_PAGES.contact);
    expect(s).toContain(`${BASE_URL}/form`);
  });
});
