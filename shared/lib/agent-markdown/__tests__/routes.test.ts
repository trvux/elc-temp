import { describe, expect, it } from "vitest";
import { resolveMarkdownRoute, STATIC_PAGE_SLUGS } from "@/shared/lib/agent-markdown/routes";
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
    for (const p of ["/san-pham/a/b", "/gioi-thieu", "/agent-md/home", "/index", "/.md", "/san-pham/.md", "/san-pham/", "/admin", "/a.md"]) {
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
  it.each([...STATIC_PAGE_SLUGS])("maps allowlisted page %s", (slug) => {
    expect(resolveMarkdownRoute(`/${slug}`)).toEqual({ target: `/agent-md/trang/${slug}`, explicit: false });
    expect(resolveMarkdownRoute(`/${slug}.md`)).toEqual({ target: `/agent-md/trang/${slug}`, explicit: true });
  });
  it("does not hijack other top-level routes", () => {
    for (const p of ["/form", "/form.md", "/login", "/magic-link", "/api", "/admin", "/about", "/co-so-ha-tang", "/gioi-thieu-ve-dien-may-elc/x", "/unknown-page"]) {
      expect(resolveMarkdownRoute(p), p).toBeNull();
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
