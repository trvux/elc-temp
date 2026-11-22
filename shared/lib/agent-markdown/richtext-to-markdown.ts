import { BASE_URL } from "@/shared/lib/seo-schema";

// Pure Tiptap/ProseMirror JSON -> Markdown converter for the AI-agent
// Markdown pages. Never throws: unknown nodes degrade to their children's
// text, malformed input yields "".

interface PMMark {
  type?: string;
  attrs?: Record<string, unknown>;
}
interface PMNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: PMMark[];
  content?: PMNode[];
}

function isNode(v: unknown): v is PMNode {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function absolutize(url: unknown, baseUrl: string): string {
  if (typeof url !== "string") return "";
  const u = url.trim();
  if (!u) return "";
  if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  try {
    return new URL(u, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  } catch {
    return u;
  }
}

function children(node: PMNode): PMNode[] {
  return Array.isArray(node.content) ? node.content.filter(isNode) : [];
}

function applyMarks(text: string, marks: PMMark[] | undefined, baseUrl: string): string {
  if (!text || !Array.isArray(marks)) return text;
  const lead = /^\s*/.exec(text)?.[0] ?? "";
  const trail = /\s*$/.exec(text)?.[0] ?? "";
  let core = text.trim();
  if (!core) return text;
  const types = marks.filter(isNode).map((m) => m.type);
  if (types.includes("code")) core = `\`${core}\``;
  if (types.includes("bold")) core = `**${core}**`;
  if (types.includes("italic")) core = `*${core}*`;
  if (types.includes("strike")) core = `~~${core}~~`;
  const link = marks.find((m) => isNode(m) && m.type === "link");
  if (link) {
    const href = absolutize(link.attrs?.href, baseUrl);
    if (href) core = `[${core}](${href})`;
  }
  return lead + core + trail;
}

function inline(node: PMNode, baseUrl: string): string {
  switch (node.type) {
    case "text":
      return applyMarks(typeof node.text === "string" ? node.text : "", node.marks, baseUrl);
    case "hardBreak":
      return "  \n";
    case "image": {
      const src = absolutize(node.attrs?.src, baseUrl);
      if (!src) return "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      return `![${alt}](${src})`;
    }
    case "contentVariable": {
      const a = node.attrs ?? {};
      const t = a.resolvedText || a.fallbackText;
      return typeof t === "string" ? t : "";
    }
    default:
      return children(node)
        .map((c) => inline(c, baseUrl))
        .join("");
  }
}

function inlineChildren(node: PMNode, baseUrl: string): string {
  return children(node)
    .map((c) => inline(c, baseUrl))
    .join("")
    .replace(/[ \t]+\n/g, (m) => (m.startsWith("  ") ? "  \n" : "\n"))
    .trim();
}

function plainText(node: PMNode): string {
  if (node.type === "text") return typeof node.text === "string" ? node.text : "";
  if (node.type === "hardBreak") return "\n";
  return children(node).map(plainText).join("");
}

function indentBlock(text: string, first: string, rest: string): string {
  return text
    .split("\n")
    .map((l, i) => (i === 0 ? first + l : l ? rest + l : l))
    .join("\n");
}

function renderList(node: PMNode, baseUrl: string, ordered: boolean): string {
  const startRaw = node.attrs?.start;
  const start = typeof startRaw === "number" ? startRaw : 1;
  const items = children(node).map((item, i) => {
    const marker = ordered ? `${start + i}. ` : "- ";
    const body = blocks(children(item).length ? children(item) : [], baseUrl, true);
    return indentBlock(body || "", marker, " ".repeat(marker.length));
  });
  return items.join("\n");
}

function renderTable(node: PMNode, baseUrl: string): string {
  const rows = children(node)
    .filter((r) => r.type === "tableRow")
    .map((r) =>
      children(r).map((cell) =>
        children(cell)
          .map((c) => inlineChildren(c.type === "paragraph" || c.type === "heading" ? c : { content: [c] }, baseUrl))
          .filter(Boolean)
          .join(" ")
          .replace(/\n+/g, " ")
          .replace(/\|/g, "\\|"),
      ),
    );
  if (!rows.length) return "";
  const cols = Math.max(...rows.map((r) => r.length), 1);
  const pad = (r: string[]) => Array.from({ length: cols }, (_, i) => r[i] ?? "");
  const line = (r: string[]) => `| ${pad(r).join(" | ")} |`;
  const [head, ...rest] = rows;
  return [line(head), line(Array(cols).fill("---")), ...rest.map(line)].join("\n");
}

function block(node: PMNode, baseUrl: string): string {
  switch (node.type) {
    case "paragraph":
      return inlineChildren(node, baseUrl);
    case "heading": {
      const lv = Number(node.attrs?.level);
      const level = Number.isInteger(lv) ? Math.min(6, Math.max(1, lv)) : 1;
      const text = inlineChildren(node, baseUrl).replace(/\s*\n\s*/g, " ");
      return text ? `${"#".repeat(level)} ${text}` : "";
    }
    case "bulletList":
      return renderList(node, baseUrl, false);
    case "orderedList":
      return renderList(node, baseUrl, true);
    case "listItem":
      return blocks(children(node), baseUrl, true);
    case "blockquote": {
      const body = blocks(children(node), baseUrl);
      return body ? body.split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n") : "";
    }
    case "codeBlock": {
      const lang = typeof node.attrs?.language === "string" ? node.attrs.language : "";
      return `\`\`\`${lang}\n${plainText(node)}\n\`\`\``;
    }
    case "horizontalRule":
      return "---";
    case "table":
      return renderTable(node, baseUrl);
    case "image":
      return inline(node, baseUrl);
    case "text":
    case "hardBreak":
    case "contentVariable":
      return inline(node, baseUrl);
    default: {
      // Unknown container: if it holds block nodes keep their structure,
      // otherwise treat as inline text.
      const kids = children(node);
      if (kids.some((c) => ["paragraph", "heading", "bulletList", "orderedList", "blockquote", "table", "codeBlock"].includes(c.type ?? ""))) {
        return blocks(kids, baseUrl);
      }
      return inlineChildren(node, baseUrl);
    }
  }
}

function blocks(nodes: PMNode[], baseUrl: string, tight = false): string {
  const parts: string[] = [];
  for (const n of nodes) {
    let out = "";
    try {
      out = block(n, baseUrl);
    } catch {
      out = "";
    }
    if (out.trim()) parts.push(out);
  }
  return parts.join(tight ? "\n" : "\n\n");
}

function parseInput(doc: unknown): PMNode | null {
  if (doc === null || doc === undefined) return null;
  if (typeof doc === "string") {
    const s = doc.trim();
    if (!s) return null;
    try {
      const parsed: unknown = JSON.parse(s);
      return isNode(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isNode(doc) ? doc : null;
}

export function richTextToMarkdown(
  doc: unknown,
  opts?: { baseUrl?: string; maxChars?: number },
): string {
  try {
    const root = parseInput(doc);
    if (!root) return "";
    const baseUrl = opts?.baseUrl || BASE_URL;
    const tops = root.type === "doc" ? children(root) : [root];
    const parts: string[] = [];
    for (const n of tops) {
      let out = "";
      try {
        out = block(n, baseUrl);
      } catch {
        out = "";
      }
      if (out.trim()) parts.push(out.replace(/\n{3,}/g, "\n\n"));
    }
    const max = opts?.maxChars;
    if (typeof max === "number" && max >= 0) {
      const kept: string[] = [];
      let len = 0;
      for (const p of parts) {
        const next = len + (kept.length ? 2 : 0) + p.length;
        if (next > max) break;
        kept.push(p);
        len = next;
      }
      if (kept.length < parts.length) return `${kept.join("\n\n")}${kept.length ? "\n\n" : ""}…`;
    }
    return parts.join("\n\n");
  } catch {
    return "";
  }
}
