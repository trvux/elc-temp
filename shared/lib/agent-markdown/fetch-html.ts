// Loopback fetch of a page's own HTML, used to derive its Markdown twin.

export interface OwnHtmlResult {
  status: number;
  html?: string;
  /** Raw Location header for 3xx answers. */
  location?: string;
}

// Only characters that can appear in a validated route segment (already decoded by Next).
const SEGMENT = /^[^/\\?#\u0000-\u001f]+$/;

/**
 * Builds the public path from validated route segments only. Returns null when anything is off,
 * so the helper can never be pointed at an arbitrary URL (no SSRF / open proxy).
 */
export function buildPublicPath(segments: readonly string[]): string | null {
  if (!segments.every((s) => s !== "" && s !== "." && s !== ".." && SEGMENT.test(s))) return null;
  return "/" + segments.map(encodeURIComponent).join("/");
}

/**
 * `publicPath` must come from buildPublicPath (or be "/<section>" built from constants). It is
 * re-validated here: it has to be an absolute path of encoded segments, nothing else.
 */
export async function fetchOwnHtml(request: Request, publicPath: string): Promise<OwnHtmlResult> {
  // "/" (the homepage) is the one valid path without a segment.
  const validShape = publicPath === "/" || /^\/[A-Za-z0-9\-._~%]+(\/[A-Za-z0-9\-._~%]+)*$/.test(publicPath);
  if (!validShape || /(^|\/)\.\.?(\/|$)/.test(publicPath)) {
    throw new Error("fetchOwnHtml: invalid path");
  }
  // The listener is always loopback; request.url's host is the public one behind nginx, so only
  // its port is used (never the Host header).
  const port = new URL(request.url).port || process.env.PORT || "3000";
  const res = await fetch(`http://127.0.0.1:${port}${publicPath}`, {
    method: "GET",
    headers: {
      Accept: "text/html",
      "User-Agent": "elc-md-internal/1.0",
      "x-elc-internal-md": "1",
    },
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (res.status >= 300 && res.status < 400) {
    return { status: res.status, location: res.headers.get("location") ?? undefined };
  }
  if (res.status !== 200) return { status: res.status };
  return { status: 200, html: await res.text() };
}
