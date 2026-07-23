// Flattens a Tiptap/ProseMirror JSON doc (products.description, pages.content,
// etc.) into plain text — used wherever we need a text excerpt (meta
// description fallback, llms-full.txt) rather than the rendered rich content.
export function richTextToPlainText(node: unknown): string {
  if (!node) return "";
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (obj.type === "text" && typeof obj.text === "string") {
      return obj.text;
    }
    if (Array.isArray(obj.content)) {
      return obj.content.map(richTextToPlainText).join(" ");
    }
  }
  if (Array.isArray(node)) {
    return node.map(richTextToPlainText).join(" ");
  }
  return "";
}

// Meta descriptions are validated at 160 chars on the admin form (see
// modules/catalog/domain/validators.ts) — a generated fallback must respect
// the same limit, cut at a word boundary rather than mid-word.
export function excerptFromRichText(node: unknown, maxLength = 160): string | undefined {
  const text = richTextToPlainText(node).replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}
