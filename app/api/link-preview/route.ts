import dns from "node:dns/promises";
import net from "node:net";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// In-memory, per-process cache — good enough here: this only saves the
// occasional duplicate hover-preview fetch within one PM2 worker's
// lifetime, not a source of truth anything depends on. No need for a
// shared store across the cluster's 2 workers.
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const cache = new Map<string, { data: LinkPreviewData; expiresAt: number }>();

const FETCH_TIMEOUT_MS = 5000;
// Only the <head> ever has the tags we want — stop reading well before a
// large page's full body, so a malicious/huge response can't tie up a
// worker or memory.
const MAX_BYTES = 300_000;

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast/reserved
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fe80:") || // link-local
    lower.startsWith("fc") ||
    lower.startsWith("fd") || // unique local
    lower.startsWith("::ffff:127.") ||
    lower.startsWith("::ffff:10.")
  );
}

function isPrivateIp(ip: string): boolean {
  return net.isIPv6(ip) ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

// Blocks SSRF: a link pasted into a product/page description is
// attacker-reachable input (any admin can type any URL), and this route
// fetches it server-side. Without this, it's a ready-made port
// scanner/metadata-endpoint prober for the VPS's internal network. Fails
// closed — a hostname that won't resolve is treated as blocked, not
// allowed.
async function isBlockedHost(hostname: string): Promise<boolean> {
  if (hostname === "localhost") return true;
  if (net.isIP(hostname)) return isPrivateIp(hostname);
  try {
    const addrs = await dns.lookup(hostname, { all: true });
    return addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address));
  } catch {
    return true;
  }
}

async function readBounded(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
    // Stop early once we've clearly passed the head section.
    if (chunks.length > 0 && new TextDecoder().decode(value).includes("</head>")) break;
  }
  reader.cancel().catch(() => {});
  return new TextDecoder("utf-8", { fatal: false }).decode(
    chunks.length === 1 ? chunks[0] : Buffer.concat(chunks.map((c) => Buffer.from(c))),
  );
}

function extractMeta(html: string, pageUrl: string): LinkPreviewData {
  const getMeta = (attr: "property" | "name", key: string): string | null => {
    const re = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["']`, "i");
    const reReversed = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["']`, "i");
    const m = html.match(re) || html.match(reReversed);
    return m ? decodeHtmlEntities(m[1]) : null;
  };

  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null;

  const image = getMeta("property", "og:image") || getMeta("name", "twitter:image");
  let absoluteImage: string | null = null;
  if (image) {
    try {
      absoluteImage = new URL(image, pageUrl).href;
    } catch {
      absoluteImage = null;
    }
  }

  return {
    url: pageUrl,
    title: getMeta("property", "og:title") || (titleTag ? decodeHtmlEntities(titleTag).trim() : null),
    description: getMeta("property", "og:description") || getMeta("name", "description"),
    image: absoluteImage,
    siteName: getMeta("property", "og:site_name") || new URL(pageUrl).hostname,
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return Response.json({ error: "missing url" }, { status: 400 });
  }

  // Everything past this point is an *expected*, routine outcome of trying
  // to preview an arbitrary URL (unreachable, blocked, not HTML, requires
  // auth, etc.) — not an application error. All of it responds 200 with
  // {error} rather than a 4xx/5xx, so the client can treat "no preview
  // available" as normal data instead of a thrown fetch failure that lights
  // up dev-mode error overlays for something the UI already renders a
  // graceful fallback for.
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return Response.json({ error: "invalid url" });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return Response.json({ error: "unsupported protocol" });
  }

  const cached = cache.get(parsed.href);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json(cached.data);
  }

  if (await isBlockedHost(parsed.hostname)) {
    return Response.json({ error: "host not allowed" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(parsed.href, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ELCLinkPreview/1.0; +https://dienmayelc.com.vn)",
        Accept: "text/html",
      },
    });
    if (!res.ok || !(res.headers.get("content-type") || "").includes("text/html")) {
      return Response.json({ error: "fetch failed" });
    }

    const html = await readBounded(res, MAX_BYTES);
    const data = extractMeta(html, res.url || parsed.href);
    cache.set(parsed.href, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return Response.json(data);
  } catch {
    return Response.json({ error: "fetch error" });
  } finally {
    clearTimeout(timer);
  }
}
