import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPublicPath } from "@/shared/lib/agent-markdown/fetch-html";
import { clearPageMarkdownCache, servePageMarkdown } from "@/shared/lib/agent-markdown/page-markdown";
import { INQUIRY_FORM_URL } from "@/shared/lib/agent-markdown/render";
import { BASE_URL } from "@/shared/lib/seo-schema";

const page = (body: string) =>
  `<html><head><title>Tiêu đề</title><meta name="description" content="Mô tả"><link rel="canonical" href="${BASE_URL}/san-pham/x"></head><body><main>${body}</main></body></html>`;
const req = (url = "http://localhost:3100/san-pham/x.md") => new Request(url);
const fallback = vi.fn(async () => new Response("LEGACY", { status: 200 }));

const mockFetch = (impl: (url: string, init: RequestInit) => Promise<Response>) =>
  vi.stubGlobal("fetch", vi.fn(impl));

beforeEach(() => {
  clearPageMarkdownCache();
  fallback.mockClear();
  delete process.env.AGENT_MD_SOURCE;
});
afterEach(() => vi.unstubAllGlobals());

describe("servePageMarkdown", () => {
  it("200: converts the loopback HTML, builds frontmatter and appends the CTA when /form is not linked", async () => {
    mockFetch(async () => new Response(page("<h1>Sản phẩm X</h1><p>Mô tả dài</p>"), { status: 200 }));
    const res = await servePageMarkdown({ request: req(), publicPath: "/san-pham/x", fallback });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect(res.headers.get("Link")).toContain(`${BASE_URL}/san-pham/x`);
    const body = await res.text();
    expect(body).toMatch(/^---\ntitle: "Tiêu đề"\ndescription: "Mô tả"\ncanonical: .*\/san-pham\/x\n---\n/);
    expect(body).toContain("# Sản phẩm X");
    expect(body).toContain("## Yêu cầu báo giá");
    expect(fallback).not.toHaveBeenCalled();
  });

  it("200: does not append the CTA when the page already links to /form", async () => {
    mockFetch(async () => new Response(page(`<h1>A</h1><a href="/form?productId=1">Báo giá</a>`), { status: 200 }));
    const body = await (await servePageMarkdown({ request: req(), publicPath: "/san-pham/x", fallback })).text();
    expect(body).toContain("](" + BASE_URL + "/form?productId=1)");
    expect(body).not.toContain("## Yêu cầu báo giá");
    expect(INQUIRY_FORM_URL).toBe(`${BASE_URL}/form`);
  });

  it("fetches loopback with the right url, headers and options (never the Host header)", async () => {
    const f = vi.fn(async () => new Response(page("<h1>A</h1>"), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await servePageMarkdown({ request: req("https://dienmayelc.com.vn:3100/san-pham/x.md"), publicPath: "/san-pham/x", fallback });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:3100/san-pham/x");
    expect(init.redirect).toBe("manual");
    expect(init.cache).toBe("no-store");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.headers).toMatchObject({ Accept: "text/html", "User-Agent": "elc-md-internal/1.0", "x-elc-internal-md": "1" });
  });

  it("uses PORT / 3000 when the request URL has no port", async () => {
    const f = vi.fn(async () => new Response(page("<h1>A</h1>"), { status: 200 }));
    vi.stubGlobal("fetch", f);
    vi.stubEnv("PORT", "4000");
    await servePageMarkdown({ request: req("https://dienmayelc.com.vn/san-pham/x.md"), publicPath: "/san-pham/x", fallback });
    expect((f.mock.calls[0] as unknown[])[0]).toBe("http://127.0.0.1:4000/san-pham/x");
    vi.unstubAllEnvs();
  });

  it("3xx: mirrors the redirect as 308 to the .md twin", async () => {
    mockFetch(async () => new Response(null, { status: 308, headers: { location: "/san-pham/new-slug" } }));
    const res = await servePageMarkdown({ request: req(), publicPath: "/san-pham/old", fallback });
    expect(res.status).toBe(308);
    expect(res.headers.get("Location")).toBe("/san-pham/new-slug.md");
    expect(fallback).not.toHaveBeenCalled();
  });

  it("3xx: absolute same-site Location is reduced to a path; foreign hosts go to fallback", async () => {
    mockFetch(async () => new Response(null, { status: 307, headers: { location: `${BASE_URL}/tin-tuc/b/` } }));
    const ok = await servePageMarkdown({ request: req(), publicPath: "/tin-tuc/a", fallback });
    expect(ok.headers.get("Location")).toBe("/tin-tuc/b.md");
    mockFetch(async () => new Response(null, { status: 307, headers: { location: "https://evil.example/x" } }));
    const bad = await servePageMarkdown({ request: req(), publicPath: "/tin-tuc/a", fallback });
    expect(await bad.text()).toBe("LEGACY");
  });

  it("404: short Markdown not-found per section", async () => {
    mockFetch(async () => new Response("nf", { status: 404 }));
    const p = await servePageMarkdown({ request: req(), publicPath: "/san-pham/zzz", fallback });
    expect(p.status).toBe(404);
    expect(await p.text()).toContain("404 - Không tìm thấy sản phẩm");
    const n = await servePageMarkdown({ request: req(), publicPath: "/tin-tuc/zzz", fallback });
    expect(n.status).toBe(404);
    expect(await n.text()).toContain("Không tìm thấy bài viết");
    expect(n.headers.get("Content-Type")).toContain("text/markdown");
    expect(fallback).not.toHaveBeenCalled();
  });

  it.each([
    ["network error", () => Promise.reject(new TypeError("fetch failed"))],
    ["timeout", () => Promise.reject(new DOMException("timed out", "TimeoutError"))],
    ["5xx", async () => new Response("boom", { status: 502 })],
  ])("%s: falls back to the DB handler", async (_n, impl) => {
    mockFetch(impl as () => Promise<Response>);
    const res = await servePageMarkdown({ request: req(), publicPath: "/san-pham/x", fallback });
    expect(await res.text()).toBe("LEGACY");
    expect(fallback).toHaveBeenCalledOnce();
  });

  it("falls back when the HTML converts to nothing", async () => {
    mockFetch(async () => new Response("<html><body><main></main></body></html>", { status: 200 }));
    const res = await servePageMarkdown({ request: req(), publicPath: "/san-pham/x", fallback });
    expect(await res.text()).toBe("LEGACY");
  });

  it("AGENT_MD_SOURCE=db forces the legacy path without fetching", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    process.env.AGENT_MD_SOURCE = "db";
    const res = await servePageMarkdown({ request: req(), publicPath: "/san-pham/x", fallback });
    expect(await res.text()).toBe("LEGACY");
    expect(f).not.toHaveBeenCalled();
  });

  it("caches 200 results only (second call does not fetch); 404 is not cached", async () => {
    const f = vi.fn(async () => new Response(page("<h1>A</h1>"), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await servePageMarkdown({ request: req(), publicPath: "/san-pham/c", fallback });
    const again = await servePageMarkdown({ request: req(), publicPath: "/san-pham/c", fallback });
    expect(f).toHaveBeenCalledTimes(1);
    expect(again.status).toBe(200);

    const nf = vi.fn(async () => new Response("", { status: 404 }));
    vi.stubGlobal("fetch", nf);
    await servePageMarkdown({ request: req(), publicPath: "/san-pham/n", fallback });
    await servePageMarkdown({ request: req(), publicPath: "/san-pham/n", fallback });
    expect(nf).toHaveBeenCalledTimes(2);
  });

  it("cache entries expire after the TTL", async () => {
    vi.useFakeTimers();
    const f = vi.fn(async () => new Response(page("<h1>A</h1>"), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await servePageMarkdown({ request: req(), publicPath: "/san-pham/t", fallback });
    vi.advanceTimersByTime(121_000);
    await servePageMarkdown({ request: req(), publicPath: "/san-pham/t", fallback });
    expect(f).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe("buildPublicPath (SSRF guard)", () => {
  it("encodes segments and rejects anything suspicious", () => {
    expect(buildPublicPath(["san-pham", "may-lanh"])).toBe("/san-pham/may-lanh");
    expect(buildPublicPath(["san-pham", "a b"])).toBe("/san-pham/a%20b");
    for (const bad of ["", "..", ".", "a/b", "a?b", "a#b", "a\\b", "a\u0000b"]) {
      expect(buildPublicPath(["san-pham", bad])).toBeNull();
    }
  });
});
