import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildGoneMarkdown,
  buildHomeMarkdown,
  buildLlmsIntro,
  MARKDOWN_HEADERS,
  TRUST_PAGES,
} from "@/shared/lib/agent-markdown/render";
import { BASE_URL, ORGANIZATION_DESCRIPTION } from "@/shared/lib/seo-schema";

const root = path.resolve(__dirname, "../../../..");

describe("buildGoneMarkdown (item: agent-friendly 404/410)", () => {
  const md = buildGoneMarkdown();
  it("explains the error in >= 20 chars and links llms.txt + sitemap", () => {
    expect(md.length).toBeGreaterThan(20);
    expect(md).toMatch(/^# 410 Gone/);
    expect(md).toContain(`${BASE_URL}/llms.txt`);
    expect(md).toContain(`${BASE_URL}/sitemap.xml`);
  });
});

describe("MARKDOWN_HEADERS", () => {
  it("declares markdown, Vary: Accept and no shared caching", () => {
    expect(MARKDOWN_HEADERS["Content-Type"]).toMatch(/^text\/markdown/);
    expect(MARKDOWN_HEADERS.Vary).toBe("Accept");
    expect(MARKDOWN_HEADERS["Cache-Control"]).toBe("no-store");
  });
});

describe("buildHomeMarkdown", () => {
  const md = buildHomeMarkdown({
    contacts: [
      { label: "Hotline", type: "phone", value: "0789978898", isActive: true },
      { label: "Hidden", type: "phone", value: "000", isActive: false },
    ],
    branches: [{ name: "Showroom", address: "06 Dương Quảng Hàm", phone: "0901" }],
    categories: [{ name: "Máy lạnh", slug: "may-lanh" }],
    services: [{ title: "Vệ sinh máy lạnh", slug: "ve-sinh" }],
    brands: [{ name: "Daikin", slug: "daikin" }],
  });

  it("has one H1, the org description, and real links", () => {
    expect(md.match(/^# /gm)).toHaveLength(1);
    expect(md).toContain(`> ${ORGANIZATION_DESCRIPTION}`);
    expect(md).toContain(`[Máy lạnh](${BASE_URL}/san-pham/may-lanh)`);
    expect(md).toContain(`(${BASE_URL}/dich-vu/ve-sinh)`);
  });

  it("includes active contacts only, plus branches", () => {
    expect(md).toContain("**Hotline**: 0789978898");
    expect(md).not.toContain("Hidden");
    expect(md).toContain("**Showroom**: 06 Dương Quảng Hàm - 0901");
  });
});

describe("buildLlmsIntro (item: agent instruction / when-to-use)", () => {
  const md = buildLlmsIntro();
  it("follows llmstxt.org shape: H1 first, blockquote summary, H2 sections", () => {
    expect(md.startsWith("# ")).toBe(true);
    expect(md).toMatch(/\n> /);
    expect(md).toContain("## When to use this site");
    expect(md).toContain("## How an agent should use it");
  });
  it("names concrete jobs, not generic marketing", () => {
    for (const job of ["air conditioner", "Fresh-air", "Installation", "Not a fit"]) {
      expect(md).toContain(job);
    }
  });
  it("links trust pages by canonical URL", () => {
    expect(md).toContain(TRUST_PAGES.about);
    expect(md).toContain(TRUST_PAGES.contact);
    expect(md).toContain(TRUST_PAGES.privacy);
  });
});

describe("trust-page aliases (item: trust anchor pages)", () => {
  const live: string[] = JSON.parse(
    readFileSync(path.join(root, "deploy/nginx/elc-live.conf.json"), "utf8"),
  );
  const redirects = readFileSync(path.join(root, "deploy/nginx/elc-redirects.conf"), "utf8");
  const nextConfig = readFileSync(path.join(root, "next.config.ts"), "utf8");

  for (const [alias, target] of [
    ["/about", TRUST_PAGES.about],
    ["/contact", TRUST_PAGES.contact],
    ["/privacy", TRUST_PAGES.privacy],
  ] as const) {
    const dest = target.replace(BASE_URL, "");
    it(`${alias} -> ${dest} exists in nginx map, next.config and the live allowlist`, () => {
      expect(live).toContain(dest);
      expect(redirects).toContain(`"${alias}" "${dest}";`);
      expect(redirects).toContain(`"${alias}/" "${dest}";`);
      expect(nextConfig).toContain(`source: "${alias}"`);
    });
  }
});

describe("nginx Markdown 410 wiring", () => {
  const install = readFileSync(path.join(root, "deploy/nginx/install.sh"), "utf8");
  const normalize = readFileSync(path.join(root, "deploy/nginx/elc-normalize.conf"), "utf8");
  it("rewrites dead paths for markdown clients to /agent-md/gone", () => {
    expect(install).toContain("rewrite ^ /agent-md/gone break;");
    expect(normalize).toContain("map $http_accept $elc_wants_md");
    expect(normalize).toContain("$elc_gone_md");
  });
  it("marks bare 410s as varying on Accept", () => {
    expect(install).toContain('add_header Vary "Accept" always; return 410;');
  });
});
