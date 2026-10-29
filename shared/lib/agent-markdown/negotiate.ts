// Content negotiation for Markdown (https://acceptmarkdown.com): a client that
// ranks text/markdown at least as high as text/html in its Accept header gets
// the Markdown representation; `*/*`, browsers and everything else get HTML.

interface AcceptEntry {
  type: string;
  q: number;
  order: number;
}

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((part, order) => {
      const [rawType, ...params] = part.trim().split(";");
      const qParam = params.map((p) => p.trim()).find((p) => /^q\s*=/i.test(p));
      const q = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1;
      return {
        type: rawType.trim().toLowerCase(),
        q: Number.isFinite(q) ? q : 0,
        order,
      };
    })
    .filter((e) => e.type !== "");
}

export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  const entries = parseAccept(accept);
  const md = entries.find((e) => e.type === "text/markdown");
  if (!md || md.q <= 0) return false;
  const html = entries.find((e) => e.type === "text/html");
  if (!html || html.q <= 0) return true;
  if (md.q !== html.q) return md.q > html.q;
  return md.order < html.order;
}
