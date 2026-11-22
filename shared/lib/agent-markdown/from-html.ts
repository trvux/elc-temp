// Pure HTML -> Markdown conversion for the agent Markdown twin of a page.
//
// The Markdown served to AI agents is derived from the RENDERED HTML of the same page, so a change
// to the page (component, copy, layout) shows up in the Markdown with no second edit.
//
// Opt out: put `data-md-ignore` on any element (or component root) that must not appear in the
// Markdown twin (decorative widgets, duplicated responsive variants, UI-only controls).

import { NodeHtmlMarkdown } from "node-html-markdown";
import { parse, type HTMLElement } from "node-html-parser";

export interface HtmlToMarkdownOptions {
  /** Public origin used to absolutize links and images (never the loopback host). */
  publicBaseUrl: string;
}

export interface HtmlToMarkdownResult {
  markdown: string;
  title: string;
  description: string;
  canonicalUrl: string | null;
  updatedAt: string | null;
}

// Elements that are never content.
const REMOVE_SELECTOR = [
  "script", "style", "noscript", "svg", "template", "footer", "form", "input", "select",
  "textarea", "dialog", "iframe", "[aria-hidden=\"true\"]", "[data-md-ignore]",
].join(",");

// `<nav>` is only removed when it is site chrome (breadcrumb, menus, footer nav). Other navs inside
// <main> (e.g. "Xem nhanh theo phân khúc" quick links) are real content and are kept.
const CHROME_NAV = /đường dẫn|breadcrumb|menu|chân trang|footer/i;

// Collapsed accordion/tab panels carry `hidden` but are real content: keep them.
const COLLAPSED_CONTENT_SELECTOR = "[role=\"region\"],[data-slot*=\"accordion-content\"],[data-slot*=\"collapsible-content\"],[data-slot*=\"tabs-content\"]";

// Button labels worth keeping: accordion questions (also handled by structure) and "show N more" counters.
const KEEP_BUTTON_TEXT = /^(hiển thị thêm|xem thêm)\s+\d+/i;

// Lines that are only UI labels if they slip through.
const NOISE_LINES = new Set(
  [
    "mua ngay", "thêm vào giỏ", "thêm vào giỏ hàng", "đặt hàng", "lọc", "bộ lọc", "xóa lọc",
    "xem thêm nội dung", "thu gọn", "đóng", "tìm kiếm", "menu", "so sánh", "yêu thích",
  ].map((s) => s.toLowerCase()),
);

const TRACKING_SRC = /(facebook\.com\/tr|google-analytics\.com|googletagmanager\.com|doubleclick\.net|\/pixel\b|\/collect\?)/i;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const normText = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

/** `/_next/image?url=<encoded>&w=..` -> decoded original URL; anything else is returned as-is. */
function unwrapNextImage(src: string, base: string): string | null {
  let target = src;
  try {
    const u = new URL(src, "http://placeholder.invalid");
    if (u.pathname === "/_next/image" || u.pathname.endsWith("/_next/image")) {
      const original = u.searchParams.get("url");
      if (!original) return null;
      target = original;
    }
  } catch {
    return null;
  }
  return absolutize(target, base);
}

interface LdInfo {
  updatedAt: string | null;
  faqs: Map<string, string>;
}

function readJsonLd(root: HTMLElement): LdInfo {
  let modified: string | null = null;
  let published: string | null = null;
  const faqs = new Map<string, string>();
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if (!modified && typeof o.dateModified === "string") modified = o.dateModified;
    if (!published && typeof o.datePublished === "string") published = o.datePublished;
    const type = o["@type"];
    const isFaq = type === "FAQPage" || (Array.isArray(type) && type.includes("FAQPage"));
    if (isFaq) {
      for (const q of ([] as unknown[]).concat(o.mainEntity ?? [])) {
        const qo = q as { name?: unknown; acceptedAnswer?: { text?: unknown } };
        if (typeof qo?.name === "string" && typeof qo.acceptedAnswer?.text === "string") {
          faqs.set(normText(qo.name), qo.acceptedAnswer.text);
        }
      }
    }
    for (const v of Object.values(o)) if (v && typeof v === "object") visit(v);
  };
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      visit(JSON.parse(s.textContent));
    } catch {
      /* malformed JSON-LD: ignore */
    }
  }
  return { updatedAt: modified ?? published, faqs };
}

/** Next.js renders collapsed FAQ answers empty; the answers live in the FAQPage JSON-LD of the same HTML. */
function fillFaqAnswers(main: HTMLElement, faqs: Map<string, string>): void {
  if (faqs.size === 0) return;
  for (const btn of main.querySelectorAll("button")) {
    const answer = faqs.get(normText(btn.textContent));
    if (!answer) continue;
    const heading = btn.closest("h1,h2,h3,h4,h5,h6") ?? btn.parentNode;
    const html = /<[a-z][\s\S]*>/i.test(answer) ? answer : `<p>${escapeHtml(answer)}</p>`;
    // Skip when the panel already rendered its answer.
    const region = heading?.nextElementSibling;
    if (region && region.textContent.trim()) continue;
    heading?.insertAdjacentHTML("afterend", `<div>${html}</div>`);
  }
}


const BLOCK_TAGS = new Set([
  "DIV", "P", "UL", "OL", "LI", "TABLE", "H1", "H2", "H3", "H4", "H5", "H6", "SECTION", "ARTICLE",
  "DL", "BLOCKQUOTE", "PRE", "FIGURE", "HEADER", "ASIDE", "NAV", "MAIN", "A",
]);
const flat = (s: string) => s.replace(/\s+/g, " ").trim();
const elementsOf = (el: HTMLElement) => el.childNodes.filter((n): n is HTMLElement => n.nodeType === 1);
const hasBlockDescendant = (el: HTMLElement) =>
  el.querySelectorAll("*").some((d) => BLOCK_TAGS.has(d.tagName) && d.tagName !== "A");

// ---- 1. Label/value rows -> "- **Label**: value" -------------------------------------------------

function specItem(label: string, valueHtml: string): string {
  return `<li><strong>${escapeHtml(label)}</strong>: ${valueHtml}</li>`;
}

/** `<dl>` (rows wrapped in divs or bare dt/dd pairs) -> `<ul>` of bold-label items. */
function convertDefinitionLists(main: HTMLElement): void {
  for (const dl of main.querySelectorAll("dl")) {
    const items: string[] = [];
    let label: string | null = null;
    let values: string[] = [];
    const flush = () => {
      if (label !== null && values.length) items.push(specItem(label, values.join(", ")));
      else if (label !== null) items.push(`<li><strong>${escapeHtml(label)}</strong></li>`);
      label = null;
      values = [];
    };
    const walk = (parent: HTMLElement) => {
      for (const c of elementsOf(parent)) {
        if (c.tagName === "DT") {
          flush();
          label = flat(c.textContent);
        } else if (c.tagName === "DD") {
          const v = c.innerHTML.trim();
          if (flat(c.textContent) || /<img/i.test(v)) values.push(v);
        } else {
          walk(c); // div wrapper around dt/dd
        }
      }
    };
    walk(dl);
    flush();
    if (items.length) dl.replaceWith(`<ul>${items.join("")}</ul>`);
  }
}

const isInlineOnly = (el: HTMLElement) => !hasBlockDescendant(el) && !el.querySelector("img,ul,ol,table");

/** A row = element with exactly two non-empty inline cells, e.g. `<div><span>Label</span><span>Value</span></div>`. */
function asTwoCellRow(el: HTMLElement): [string, string] | null {
  if (!["DIV", "LI", "P", "TR"].includes(el.tagName) && el.tagName !== "SPAN") return null;
  if (el.tagName === "TR") return null; // real tables are handled by the Markdown table converter
  const kids = elementsOf(el);
  if (kids.length !== 2) return null;
  const strayText = el.childNodes.some((n) => n.nodeType === 3 && n.textContent.trim());
  if (strayText) return null;
  const [a, b] = kids;
  if (!isInlineOnly(a) || !isInlineOnly(b)) return null;
  const label = flat(a.textContent);
  const value = flat(b.textContent);
  if (!label || !value || label.length > 80 || value.length > 200) return null;
  if (a.tagName === "A" || b.tagName === "A" || a.querySelector("a") || b.querySelector("a")) return null;
  return [label, value];
}

/** A container whose element children are all (>= 3) two-cell rows is a spec/info list. */
function convertTwoCellRowGroups(main: HTMLElement): void {
  const candidates = new Set<HTMLElement>();
  for (const el of main.querySelectorAll("div,span,li,p")) {
    const p = el.parentNode as HTMLElement | null;
    if (p && p.tagName !== "UL" && p.tagName !== "OL") candidates.add(p);
  }
  for (const container of candidates) {
    if (!container.parentNode) continue;
    const kids = elementsOf(container);
    if (kids.length < 3) continue;
    const rows = kids.map(asTwoCellRow);
    if (rows.some((r) => r === null)) continue;
    const ul = (rows as [string, string][]).map(([l, v]) => specItem(l, escapeHtml(v))).join("");
    container.set_content(`<ul>${ul}</ul>`);
  }
}

// ---- 2. Cards (link wrapping image + text) -> "- [Title](url): secondary" -----------------------

const PRICE_OLD = /(\S+) \(giá cũ ([^)]+)\)(?: (-\d+(?:[.,]\d+)?%))?/g;

function collectPieces(root: HTMLElement): string[] {
  const pieces: string[] = [];
  const flushBuf = (buf: string[]) => {
    const t = flat(buf.join(" ").replace(/\s+([.,;:!?)%\]])/g, "$1"));
    if (t) pieces.push(t);
    buf.length = 0;
  };
  const walk = (el: HTMLElement) => {
    const buf: string[] = [];
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        buf.push(n.textContent);
      } else if (n.nodeType === 1) {
        const c = n as HTMLElement;
        if (/^(DIV|P|UL|OL|LI|H[1-6]|SECTION|ARTICLE|TABLE|FIGURE)$/.test(c.tagName)) {
          flushBuf(buf);
          walk(c);
        } else {
          buf.push(c.textContent);
        }
      }
    }
    flushBuf(buf);
  };
  walk(root);
  return pieces;
}

function convertCards(main: HTMLElement): void {
  for (const a of main.querySelectorAll("a")) {
    if (!a.parentNode || (!a.querySelector("img") && !a.querySelector("h1,h2,h3,h4,h5,h6"))) continue;
    const href = a.getAttribute("href");
    if (!href) continue;
    const heading = a.querySelector("h1,h2,h3,h4,h5,h6");
    const img = a.querySelector("img");
    const alt = flat(img?.getAttribute("alt") ?? "");
    const title = flat(heading?.textContent ?? "") || alt || flat(a.querySelector("strong,b")?.textContent ?? "");
    if (!title) continue;

    const clone = parse(`<div>${a.innerHTML}</div>`).firstChild as HTMLElement;
    for (const i of clone.querySelectorAll("img")) i.remove();
    for (const old of clone.querySelectorAll("s,del")) {
      const t = flat(old.textContent);
      old.replaceWith(t ? `<span>(giá cũ ${escapeHtml(t)})</span>` : "");
    }
    const pieces = collectPieces(clone);
    // Card-like = a heading, or several separate text pieces; a plain captioned image link stays as is.
    if (!heading && pieces.length < 2) continue;
    if (!img && pieces.length < 2) continue; // a link around a bare heading is just a heading link

    const cmp = (x: string) => normText(x).replace(/\s+([.,;:!?)%\]])/g, "$1");
    const t = cmp(title);
    const seen = new Set<string>();
    const secondary: string[] = [];
    for (let p of pieces) {
      // an UPPERCASE copy of the title often opens the excerpt: drop that prefix
      const bare = title.replace(/[\s.!?…]+$/, "");
      if (p.length > bare.length && p.toLowerCase().startsWith(bare.toLowerCase())) p = p.slice(bare.length).replace(/^[\s.!?…]+/, "");
      const n = cmp(p);
      if (!n) continue;
      if (n === t || n === cmp(alt) || seen.has(n)) continue;
      seen.add(n);
      secondary.push(p);
    }
    const rest = secondary.join(" · ").replace(PRICE_OLD, (_m, cur: string, old: string, pct?: string) =>
      `${cur} (giá cũ ${old}${pct ? `, ${pct}` : ""})`,
    );
    const link = `<a href="${escapeHtml(href).replace(/"/g, "&quot;")}">${escapeHtml(title)}</a>`;
    const body = `${link}${rest ? `: ${escapeHtml(rest)}` : ""}`;

    if (a.closest("li")) {
      a.replaceWith(body);
      continue;
    }
    const prev = a.previousElementSibling as HTMLElement | null;
    if (prev && prev.getAttribute("data-md-cards") !== null) {
      prev.insertAdjacentHTML("beforeend", `<li>${body}</li>`);
      a.remove();
    } else {
      a.replaceWith(`<ul data-md-cards><li>${body}</li></ul>`);
    }
  }
}

// ---- 3. Reviews: author/date separation and star ratings --------------------------------------

function convertMetaAndRatings(main: HTMLElement): void {
  for (const r of main.querySelectorAll('[role="img"][aria-label]')) {
    const label = flat(r.getAttribute("aria-label") ?? "");
    if (label && !flat(r.textContent) && !r.querySelector("img")) r.replaceWith(`<div>${escapeHtml(label)}</div>`);
  }
  for (const time of main.querySelectorAll("time")) {
    const prev = time.previousSibling;
    const prevEl = prev && prev.nodeType === 1 ? (prev as HTMLElement) : null;
    if (prevEl && flat(prevEl.textContent) && flat(time.textContent) && !time.nextSibling) {
      time.insertAdjacentHTML("beforebegin", " — ");
    }
  }
}

// ---- 4. Gallery: put leading image-only blocks after the H1 ---------------------------------------

function moveLeadingImagesAfterH1(blocks: string[]): string[] {
  const isImg = (b: string) => /^(!\[[^\]]*\]\([^)]*\)\s*)+$/.test(b.trim());
  let i = 0;
  while (i < blocks.length && isImg(blocks[i])) i++;
  if (i === 0 || i >= blocks.length || !/^# /.test(blocks[i])) return blocks;
  const seen = new Set<string>();
  const imgs: string[] = [];
  for (const b of blocks.slice(0, i)) {
    for (const m of b.match(/!\[[^\]]*\]\([^)]*\)/g) ?? []) {
      const url = /\(([^)]*)\)$/.exec(m)?.[1] ?? m;
      if (!seen.has(url)) {
        seen.add(url);
        imgs.push(m);
      }
    }
  }
  const h1 = blocks[i];
  let j = i + 1;
  // keep the one-line summary right under the H1 (e.g. "Model: ...") before the images
  if (j < blocks.length && /^[^#\-*!\[>|`\s]/.test(blocks[j]) && !blocks[j].includes("\n")) j++;
  return [h1, ...blocks.slice(i + 1, j), imgs.join("\n"), ...blocks.slice(j)];
}

function prepare(main: HTMLElement, base: string, faqs: Map<string, string>): void {
  fillFaqAnswers(main, faqs);

  for (const el of main.querySelectorAll(REMOVE_SELECTOR)) el.remove();
  for (const nav of main.querySelectorAll("nav")) {
    const label = `${nav.getAttribute("aria-label") ?? ""} ${nav.getAttribute("data-slot") ?? ""}`;
    if (CHROME_NAV.test(label)) nav.remove();
  }
  const collapsed = new Set<unknown>(main.querySelectorAll(COLLAPSED_CONTENT_SELECTOR));
  for (const el of main.querySelectorAll("[hidden]")) {
    if (!collapsed.has(el) || !el.textContent.trim()) el.remove();
  }

  // Buttons are UI, except accordion questions / headings and "show N more" counters.
  for (const btn of main.querySelectorAll("button")) {
    const text = btn.textContent.replace(/\s+/g, " ").trim();
    const keep =
      text &&
      (btn.getAttribute("data-slot") === "accordion-trigger" ||
        btn.closest("h1,h2,h3,h4,h5,h6") !== null ||
        KEEP_BUTTON_TEXT.test(text));
    if (keep) btn.replaceWith(escapeHtml(text));
    else btn.remove();
  }

  for (const img of main.querySelectorAll("img")) {
    const src = img.getAttribute("src") ?? "";
    const w = Number(img.getAttribute("width"));
    const h = Number(img.getAttribute("height"));
    const tiny = (w > 0 && w <= 1) || (h > 0 && h <= 1);
    if (!src || src.startsWith("data:") || tiny || TRACKING_SRC.test(src)) {
      img.remove();
      continue;
    }
    const abs = unwrapNextImage(src, base);
    if (!abs) {
      img.remove();
      continue;
    }
    img.setAttribute("src", abs);
    img.removeAttribute("srcset");
  }

  for (const a of main.querySelectorAll("a")) {
    const href = (a.getAttribute("href") ?? "").trim();
    const lower = href.toLowerCase();
    const abs =
      !href || href.startsWith("#") || lower.startsWith("javascript:") || lower.startsWith("data:")
        ? null
        : lower.startsWith("mailto:") || lower.startsWith("tel:")
          ? href
          : absolutize(href, base);
    if (abs) a.setAttribute("href", abs);
    else a.replaceWith(a.innerHTML); // keep the text, drop the dead link
  }

  convertDefinitionLists(main);
  convertTwoCellRowGroups(main);
  convertCards(main);
  convertMetaAndRatings(main);
}

/** Collapse consecutive duplicated runs of blocks (responsive pages may render a block twice). */
function dedupeBlocks(blocks: string[]): string[] {
  const out = [...blocks];
  const MAX_RUN = 40;
  for (let i = 0; i < out.length; i++) {
    for (let k = Math.min(MAX_RUN, Math.floor((out.length - i) / 2)); k >= 1; k--) {
      let same = true;
      for (let j = 0; j < k; j++) {
        if (out[i + j] !== out[i + k + j] || out[i + j].length < 3) {
          same = false;
          break;
        }
      }
      if (same) {
        out.splice(i + k, k);
        i--; // re-check at the same position (triple repeats)
        break;
      }
    }
  }
  return out;
}

function cleanMarkdown(raw: string): string {
  const text = raw
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/(?<!!)\[\s*\]\([^)]*\)/g, "") // empty links (never images)
    .replace(/[ \t]+$/gm, "");

  const lines = text.split("\n").filter((line) => {
    const t = line.trim();
    if (/^#{1,6}$/.test(t)) return false; // empty heading
    if (/^[-*+]$/.test(t)) return false; // empty list item
    const bare = t.replace(/^[-*+]\s+/, "");
    if (NOISE_LINES.has(bare.toLowerCase())) return false;
    const onlyLink = /^\[([^\]]+)\]\([^)]*\)$/.exec(bare); // a button-like link that is only a UI label
    if (onlyLink && NOISE_LINES.has(onlyLink[1].trim().toLowerCase())) return false;
    return true;
  });

  const blocks = lines
    .join("\n")
    .split(/\n{2,}/)
    .map((b) => b.replace(/^\n+|\n+$/g, ""))
    .filter((b) => b.trim().length > 0);
  return moveLeadingImagesAfterH1(dedupeBlocks(blocks)).join("\n\n").trim();
}

const nhm = new NodeHtmlMarkdown({
  bulletMarker: "-",
  codeBlockStyle: "fenced",
  useInlineLinks: true,
  maxConsecutiveNewlines: 2,
  keepDataImages: false,
});

export function htmlToMarkdownPage(html: string, opts: HtmlToMarkdownOptions): HtmlToMarkdownResult {
  const base = opts.publicBaseUrl.replace(/\/+$/, "") + "/";
  const root = parse(html, { comment: false });

  const title = (root.querySelector("head title")?.textContent ?? root.querySelector("title")?.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const description = (root.querySelector('meta[name="description"]')?.getAttribute("content") ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const canonicalRaw = root.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim();
  const canonicalUrl = canonicalRaw ? absolutize(canonicalRaw, base) : null;
  const ld = readJsonLd(root);

  const main = root.querySelector("main") ?? root.querySelector("body") ?? root;
  prepare(main, base, ld.faqs);
  // Sibling blocks/spans without whitespace between them would glue words together ("Còn hàngdaikin").
  const spaced = main.innerHTML.replace(/<\/div>/g, "</div> ").replace(/<\/span>(?=[^\s.,;:!?)\]%])/g, "</span> ");
  const markdown = cleanMarkdown(nhm.translate(spaced));

  return { markdown, title, description, canonicalUrl, updatedAt: ld.updatedAt };
}
