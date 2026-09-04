import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import { cn } from "@/shared/lib/utils";

// ---------------------------------------------------------------------------
// Utility: patch legacy Tiptap JSON that was stored without attrs.level on
// heading nodes, defaulting to level 2 (the topmost level body content is
// allowed to use — see getTiptapExtensions' heading levels below). The
// page's own <h1> always comes from a separate structured title field, never
// from this content, so no heading in body content is ever level 1.
// ---------------------------------------------------------------------------
type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

function stripMarksFromContent(nodes: TiptapNode[], typesToStrip: string[]): TiptapNode[] {
  return nodes.map((node) => {
    const marks = node.marks
      ? node.marks.filter((mark) => !typesToStrip.includes(mark.type))
      : undefined;

    const normalizedContent = node.content
      ? stripMarksFromContent(node.content, typesToStrip)
      : undefined;

    const updatedNode = {
      ...node,
      ...(normalizedContent !== undefined ? { content: normalizedContent } : {}),
    };

    if (node.marks) {
      if (marks && marks.length > 0) {
        updatedNode.marks = marks;
      } else {
        delete updatedNode.marks;
      }
    }

    return updatedNode;
  });
}

// Must match getTiptapExtensions' heading.levels below. Kept as a separate
// constant because this file normalizes JSON before it ever reaches an
// Editor instance (so the Heading extension's own level clamping, which
// only applies at render/DOM time, hasn't run yet) — see the clamp below.
const HEADING_LEVELS = [2, 3] as const;

function normalizeHeadingAttrs(node: TiptapNode): TiptapNode {
  let normalizedContent = node.content
    ? node.content.map(normalizeHeadingAttrs)
    : undefined;

  if (node.type === "heading") {
    // Missing attrs.level (legacy DB records) defaults to the topmost
    // allowed level. An explicit but out-of-range level (e.g. old content
    // still carrying level 1 before its one-time DB migration) is clamped
    // the same way, not left as-is: loading an invalid level straight into
    // a live Tiptap editor makes its toolbar/isActive checks not recognize
    // the node as any valid heading, and clicking a heading button on it
    // then toggles the node OFF into a plain paragraph instead of fixing
    // the level — silently discarding real content. Clamping here, before
    // the JSON ever reaches the editor, avoids that trap entirely.
    const rawLevel = node.attrs && node.attrs.level !== undefined ? Number(node.attrs.level) : HEADING_LEVELS[0];
    const level = (HEADING_LEVELS as readonly number[]).includes(rawLevel) ? rawLevel : HEADING_LEVELS[0];
    if (normalizedContent) {
      if (level === 2) {
        normalizedContent = stripMarksFromContent(normalizedContent, ["bold", "italic", "link"]);
      } else if (level === 3) {
        normalizedContent = stripMarksFromContent(normalizedContent, ["bold", "italic"]);
      }
    }
    return {
      ...node,
      attrs: { ...(node.attrs ?? {}), level },
      ...(normalizedContent !== undefined ? { content: normalizedContent } : {}),
    };
  }

  return normalizedContent !== undefined
    ? { ...node, content: normalizedContent }
    : node;
}

export function normalizeTiptapJson(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const doc = value as TiptapNode;
  if (!doc.content || doc.content.length === 0) return doc;

  return { ...doc, content: doc.content.map(normalizeHeadingAttrs) };
}

export const getTiptapExtensions = () => [
  StarterKit.configure({
    horizontalRule: false,
    link: false,
    heading: {
      levels: [...HEADING_LEVELS],
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "font-medium text-blue-600 dark:text-blue-400 no-underline cursor-pointer",
    },
  }),
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        align: {
          default: "center",
          renderHTML: (attributes) => {
            const classes = cn(
              "my-12 transition-all duration-500 ease-in-out block",
              attributes.align === "center" && "mx-auto max-w-full rounded-sm",
              attributes.align === "wide" &&
                "w-full md:w-[calc(100%+160px)] md:-mx-20 max-w-none rounded-sm",
              attributes.align === "full" &&
                "w-screen max-w-none -ml-[calc((100vw-100%)/2)] -mr-[calc((100vw-100%)/2)] rounded-none",
            );
            return {
              "data-align": attributes.align,
              class: classes,
            };
          },
          parseHTML: (element) =>
            element.getAttribute("data-align") || "center",
        },
        ratio: {
          default: "auto",
          renderHTML: (attributes) => {
            if (!attributes.ratio || attributes.ratio === "auto") return {};
            return {
              "data-ratio": attributes.ratio,
              style: `aspect-ratio: ${attributes.ratio}; object-fit: cover;`,
            };
          },
          parseHTML: (element) => element.getAttribute("data-ratio") || "auto",
        },
      };
    },
  }).configure({
    HTMLAttributes: {
      class: "h-auto transition-all duration-500 ease-in-out rounded-sm",
    },
  }),
  HorizontalRule.extend({
    parseHTML() {
      return [{ tag: 'div[class*="section-divider"]' }, { tag: "hr" }];
    },
    renderHTML() {
      return ["hr", { class: "my-6 border-t border-border" }];
    },
  }),
  Table.configure({
    resizable: typeof window !== "undefined",
    HTMLAttributes: {
      class: "w-full border-collapse",
    },
  }),
  TableRow,
  TableHeader,
  TableCell,
];
