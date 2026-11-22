// Serves the Markdown twin of a page by converting that page's own rendered HTML.
// Anything unexpected falls back to the DB-based handler so Markdown never breaks.

import { fetchOwnHtml } from "./fetch-html";
import { htmlToMarkdownPage } from "./from-html";
import { buildInquirySection, buildFrontmatter, MARKDOWN_HEADERS, markdownHeaders } from "./render";
import { buildNewsNotFoundMarkdown } from "./render-news";
import { buildProductNotFoundMarkdown } from "./render-products";
import { BASE_URL } from "@/shared/lib/seo-schema";

const TTL_MS = 120_000;
const MAX_ENTRIES = 200;
const cache = new Map<string, { body: string; expires: number }>();

export function clearPageMarkdownCache(): void {
  cache.clear();
}

function cacheGet(key: string): string | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.body;
}

function cacheSet(key: string, body: string): void {
  cache.delete(key);
  cache.set(key, { body, expires: Date.now() + TTL_MS });
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

const HAS_FORM_LINK = /\]\((?:https?:\/\/[^/)\s]+)?\/form(?:[/?#][^)\s]*)?\)/;

function notFoundBody(publicPath: string): string {
  return publicPath.startsWith("/tin-tuc") ? buildNewsNotFoundMarkdown() : buildProductNotFoundMarkdown();
}

/** Maps the Location of an HTML redirect to the same-site path of its Markdown twin, or null. */
function markdownRedirectTarget(location: string): string | null {
  let url: URL;
  try {
    url = new URL(location, "http://127.0.0.1");
  } catch {
    return null;
  }
  const publicHost = new URL(BASE_URL).host;
  const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  if (!local && url.host !== publicHost) return null; // never bounce agents to another site
  const path = url.pathname.replace(/\/+$/, "");
  return path ? `${path}.md` : "/index.md";
}

export interface ServePageMarkdownInput {
  request: Request;
  publicPath: string;
  /** The existing DB-based handler logic. */
  fallback: () => Response | Promise<Response>;
}

export async function servePageMarkdown({ request, publicPath, fallback }: ServePageMarkdownInput): Promise<Response> {
  if (process.env.AGENT_MD_SOURCE === "db") return fallback();

  const cached = cacheGet(publicPath);
  if (cached !== null) return new Response(cached, { status: 200, headers: markdownHeaders(publicPath) });

  try {
    const res = await fetchOwnHtml(request, publicPath);

    if (res.status === 200 && res.html !== undefined) {
      const page = htmlToMarkdownPage(res.html, { publicBaseUrl: BASE_URL });
      if (!page.markdown.trim()) return fallback();
      const front = buildFrontmatter({
        title: page.title,
        description: page.description,
        canonicalUrl: `${BASE_URL}${publicPath}`,
        updatedAt: page.updatedAt,
      });
      let body = `${front}\n${page.markdown}\n`;
      if (!HAS_FORM_LINK.test(page.markdown)) body += `\n${buildInquirySection()}`;
      cacheSet(publicPath, body);
      return new Response(body, { status: 200, headers: markdownHeaders(publicPath) });
    }

    if (res.status >= 300 && res.status < 400 && res.location) {
      const target = markdownRedirectTarget(res.location);
      if (target) {
        return new Response(null, {
          status: 308,
          headers: { Location: target, Vary: "Accept", "Cache-Control": "no-store" },
        });
      }
      return fallback();
    }

    if (res.status === 404) {
      return new Response(notFoundBody(publicPath), { status: 404, headers: MARKDOWN_HEADERS });
    }
  } catch {
    // network error, timeout, conversion failure: fall through to the DB path
  }
  return fallback();
}
