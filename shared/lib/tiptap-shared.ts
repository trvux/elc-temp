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
// heading nodes. When attrs is absent Tiptap defaults to level 1, which
// silently promotes every H2 to H1 on load - both in the admin editor and
// in the public PreviewContent renderer.
// ---------------------------------------------------------------------------
export type TiptapNode = {
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

function normalizeHeadingAttrs(node: TiptapNode): TiptapNode {
  let normalizedContent = node.content
    ? node.content.map(normalizeHeadingAttrs)
    : undefined;

  if (node.type === "heading") {
    const level = node.attrs && node.attrs.level !== undefined ? Number(node.attrs.level) : 1;
    if (normalizedContent) {
      if (level === 1) {
        normalizedContent = stripMarksFromContent(normalizedContent, ["bold", "italic", "link"]);
      } else if (level === 2) {
        normalizedContent = stripMarksFromContent(normalizedContent, ["bold", "italic"]);
      }
    }
    return {
      ...node,
      attrs: { level: 1, ...(node.attrs ?? {}) },
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

  const content = doc.content.map((node, index) => {
    // Dòng đầu tiên (index === 0) luôn phải là heading level 1 làm tiêu đề
    if (index === 0) {
      if (node.type === "paragraph" || node.type === "heading") {
        const normalizedContent = node.content
          ? stripMarksFromContent(node.content.map(normalizeHeadingAttrs), ["bold", "italic", "link"])
          : undefined;
        return {
          ...node,
          type: "heading",
          attrs: {
            ...(node.attrs ?? {}),
            level: 1,
          },
          ...(normalizedContent !== undefined ? { content: normalizedContent } : {}),
        };
      }
    }
    return normalizeHeadingAttrs(node);
  });

  return { ...doc, content };
}

export const getTiptapExtensions = () => [
  StarterKit.configure({
    horizontalRule: false,
    link: false,
    heading: {
      levels: [1, 2],
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "font-medium text-primary underline underline-offset-4 cursor-pointer",
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
