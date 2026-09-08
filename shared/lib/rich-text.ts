// Flattens a Tiptap/ProseMirror JSON doc (products.description, pages.content,
// etc.) into plain text — used wherever we need a text excerpt (meta
// description fallback, llms-full.txt) rather than the rendered rich content.
function richTextToPlainText(node: unknown): string {
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

interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

// News content can be stored as either Tiptap JSON or a plain/HTML string
// (legacy WordPress-imported rows) — unlike excerptFromRichText above, this
// handles both shapes and drops heading nodes so the excerpt is body copy,
// not a repeat of the title.
export function getExcerptFromContent(
  content: unknown,
  fallbackDescription: string | null | undefined,
): string {
  if (!content) return fallbackDescription || "";

  try {
    let doc: TiptapNode | null = null;

    if (typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed.startsWith("{")) {
        doc = JSON.parse(trimmed) as TiptapNode;
      } else {
        const stripped = content
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (stripped.length > 180) {
          return stripped.substring(0, 180) + "...";
        }
        return stripped || fallbackDescription || "";
      }
    } else if (typeof content === "object" && content !== null) {
      doc = content as TiptapNode;
    }

    if (doc) {
      const textParts: string[] = [];
      const traverse = (node: TiptapNode) => {
        if (node.type === "heading") {
          return;
        }
        if (node.type === "text" && node.text) {
          textParts.push(node.text);
        }
        if (node.content) {
          node.content.forEach(traverse);
        }
      };

      traverse(doc);
      const combinedText = textParts.join(" ").replace(/\s+/g, " ").trim();
      if (combinedText.length > 180) {
        return combinedText.substring(0, 180) + "...";
      }
      return combinedText || fallbackDescription || "";
    }
  } catch (err) {
    console.error("Error parsing news content for excerpt:", err);
  }

  return fallbackDescription || "";
}
