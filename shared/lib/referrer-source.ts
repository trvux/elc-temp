// Turns the Referer a visitor arrived with into the same source / medium pair GA4 uses
// ("google / organic"), for leads that carry no gclid and no utm_*: without it, every
// lead from Google search or a Facebook post has a blank source in the admin and the
// Excel export. Pure and side-effect free; the cookie is written in attribution-capture.ts.

export interface ReferrerSource {
  source: string;
  medium: "organic" | "social" | "referral";
  /** The referring host as seen ("www.google.com"), kept for debugging odd cases. */
  host: string;
}

// Search engines whose organic results send traffic. Matched on the registrable name so
// google.com, www.google.com.vn and google.co.uk all count.
const SEARCH_ENGINES: Array<{ name: string; pattern: RegExp }> = [
  { name: "google", pattern: /(^|\.)google\.[a-z.]+$/ },
  { name: "bing", pattern: /(^|\.)bing\.com$/ },
  { name: "yahoo", pattern: /(^|\.)yahoo\.[a-z.]+$/ },
  { name: "duckduckgo", pattern: /(^|\.)duckduckgo\.com$/ },
  { name: "coccoc", pattern: /(^|\.)coccoc\.com$/ },
  { name: "baidu", pattern: /(^|\.)baidu\.com$/ },
  { name: "yandex", pattern: /(^|\.)yandex\.[a-z.]+$/ },
  { name: "ecosia", pattern: /(^|\.)ecosia\.org$/ },
];

const SOCIAL: Array<{ name: string; pattern: RegExp }> = [
  { name: "facebook", pattern: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/ },
  { name: "zalo", pattern: /(^|\.)(zalo\.me|zaloapp\.com|zalo\.vn)$/ },
  { name: "youtube", pattern: /(^|\.)(youtube\.com|youtu\.be)$/ },
  { name: "tiktok", pattern: /(^|\.)tiktok\.com$/ },
  { name: "instagram", pattern: /(^|\.)instagram\.com$/ },
  { name: "linkedin", pattern: /(^|\.)(linkedin\.com|lnkd\.in)$/ },
  { name: "twitter", pattern: /(^|\.)(twitter\.com|x\.com|t\.co)$/ },
  { name: "pinterest", pattern: /(^|\.)pinterest\.[a-z.]+$/ },
];

// AI assistants live on hosts that would otherwise look like a search engine
// (gemini.google.com): they are a referral from that site, not Google organic.
const NOT_SEARCH = /^(gemini|bard|notebooklm|mail|docs|drive|accounts|translate|sites|news|maps|photos|play|classroom|calendar)\.google\./;

function hostOf(referer: string): string | null {
  try {
    const url = new URL(referer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

function sameSite(host: string, siteHost: string): boolean {
  const strip = (h: string) => h.replace(/^www\./, "");
  const a = strip(host);
  const b = strip(siteHost.toLowerCase());
  return a === b || a.endsWith(`.${b}`);
}

/**
 * The inferred source of a visit, or null when there is none to infer: no Referer (the
 * visitor typed the address, used a bookmark or an app that sends none: "direct"), an
 * unreadable one, or the visitor is just moving around our own site.
 */
export function classifyReferrer(referer: string | null | undefined, siteHost: string): ReferrerSource | null {
  if (!referer) return null;
  const host = hostOf(referer);
  if (!host || sameSite(host, siteHost)) return null;

  if (!NOT_SEARCH.test(host)) {
    const engine = SEARCH_ENGINES.find((e) => e.pattern.test(host));
    if (engine) return { source: engine.name, medium: "organic", host };
  }
  const social = SOCIAL.find((s) => s.pattern.test(host));
  if (social) return { source: social.name, medium: "social", host };

  return { source: host.replace(/^www\./, ""), medium: "referral", host };
}
