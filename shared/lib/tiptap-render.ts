import Image from "@tiptap/extension-image";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Blockquote from "@tiptap/extension-blockquote";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import { BulletList, OrderedList, ListItem } from "@tiptap/extension-list";
import { cn } from "@/shared/lib/utils";

// This file MUST NOT import "@tiptap/starter-kit" (directly or transitively)
// — that was the whole point of splitting it out of tiptap-shared.ts. A
// first attempt at trimming PreviewContent's bundle kept both extension
// lists as two functions in the SAME file as getTiptapExtensions(); that
// still shipped StarterKit's Dropcursor/Gapcursor/UndoRedo to every public
// page, because `import StarterKit from "@tiptap/starter-kit"` at a
// module's top level runs the moment ANYTHING from that module is
// imported, regardless of which exported function actually gets called.
// Only a real file boundary stops that. Verify with (from the repo root):
//   grep -rl "starter-kit" $(grep -rl "tiptap-render" --include=*.tsx --include=*.ts -l .)
// should print nothing.

// ---------------------------------------------------------------------------
// Utility: patch legacy Tiptap JSON that was stored without attrs.level on
// heading nodes, defaulting to level 2 (the topmost level body content is
// allowed to use — see getTiptapExtensionsForRender's heading levels below).
// The page's own <h1> always comes from a separate structured title field,
// never from this content, so no heading in body content is ever level 1.
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

// Must match getTiptapExtensions' (tiptap-shared.ts) heading.levels — the
// two lists have to agree on which levels are valid, even though they now
// live in different files. Kept as a separate constant here because this
// file normalizes JSON before it ever reaches an Editor instance (so the
// Heading extension's own level clamping, which only applies at
// render/DOM time, hasn't run yet) — see the clamp below.
export const HEADING_LEVELS = [2, 3] as const;

// Must match the same `types` passed to TextAlign in both extension lists
// below — like HEADING_LEVELS, kept as one constant so admin and render
// can't drift apart on which node types are allowed to carry a textAlign
// attribute.
export const TEXT_ALIGN_TYPES = ["heading", "paragraph"] as const;

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

// Exported (not just inlined into sharedNodeExtensions below) so
// tiptap-shared.ts (admin) can `.extend()` this SAME base again to attach
// a NodeView, instead of redefining align/ratio/width from scratch — see
// tiptap-shared.ts's AdminImage. Extensions with the same `name` collapse
// to "last one in the array wins" both for schema (getSchemaByResolvedExtensions'
// Object.fromEntries) and for nodeViews (ExtensionManager.nodeViews' own
// Object.fromEntries), so placing AdminImage after ...sharedNodeExtensions()
// in getTiptapExtensions() safely overrides this plain version — verified
// by reading @tiptap/core's dist source directly, not assumed.
// left/center/right — matches shadcn-tiptap's demo model (position of a
// width-capped image within the content column). Replaces the old
// center/wide/full model (which let an image break out wider than the
// content column) per an explicit decision: that breakout look can't
// coexist with resize-handle-driven width, so legacy "wide"/"full" values
// in already-stored content fall back to "center" (see ALIGN_VALUES below)
// rather than being migrated — a real but accepted visual regression for
// whatever existing images used those two values.
const ALIGN_VALUES = ["left", "center", "right"] as const;
type ImageAlign = (typeof ALIGN_VALUES)[number];

function normalizeAlign(value: unknown): ImageAlign {
  return (ALIGN_VALUES as readonly string[]).includes(value as string)
    ? (value as ImageAlign)
    : "center";
}

export function createImageExtension() {
  return Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        align: {
          default: "center",
          renderHTML: (attributes) => {
            const align = normalizeAlign(attributes.align);
            const classes = cn(
              "my-8 block transition-all duration-300 ease-in-out rounded-sm",
              align === "left" && "mr-auto ml-0",
              align === "center" && "mx-auto",
              align === "right" && "ml-auto mr-0",
            );
            return {
              "data-align": align,
              class: classes,
            };
          },
          parseHTML: (element) => normalizeAlign(element.getAttribute("data-align")),
        },
        // Legacy-only from here down: no longer editable from the UI, kept
        // purely so images published before this change keep rendering
        // with whatever aspect-ratio crop they already had.
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
        // Free-drag resize (admin NodeView only). Defaults to "100%" —
        // same effective width every image had under the old center/wide
        // model's CSS classes — so nothing shifts for existing content
        // until someone actually drags a handle on it.
        width: {
          default: "100%",
          renderHTML: (attributes) => {
            if (!attributes.width) return {};
            const width =
              typeof attributes.width === "number" ? `${attributes.width}px` : attributes.width;
            return { style: `width: ${width}; max-width: 100%;` };
          },
          parseHTML: (element) => element.style.width || null,
        },
        // Free-drag corner handle (admin NodeView only) — no fixed rounding
        // for every image regardless of subject. A blueprint/diagram reads
        // wrong with the same rounded corners that suit a product photo, so
        // this is left to whoever placed the image rather than baked into
        // the className. Undefined by default: renders nothing extra, so
        // existing content keeps the plain className's own rounded-sm.
        borderRadius: {
          default: null,
          renderHTML: (attributes) => {
            if (attributes.borderRadius === null || attributes.borderRadius === undefined) return {};
            return { style: `border-radius: ${attributes.borderRadius}px;` };
          },
          parseHTML: (element) => {
            const value = element.style.borderRadius;
            return value ? parseFloat(value) : null;
          },
        },
      };
    },
  });
}

// Shared by both extension lists (this file's getTiptapExtensionsForRender
// and tiptap-shared.ts's getTiptapExtensions) — node types + the
// interactive editor's own custom Image/HorizontalRule/Table config, none
// of which differ between editing and read-only rendering. Exported so
// tiptap-shared.ts can reuse it without duplicating the config.
export const sharedNodeExtensions = () => [
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      // Structural only — color/underline live in globals.css's `.tiptap
      // a` rule instead. This class string gets baked into each mark's
      // own stored attrs the moment it's created (see that CSS comment),
      // so anything we'd want to change later (like a color) has no
      // business being here.
      class: "font-medium cursor-pointer",
    },
  }),
  createImageExtension().configure({
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

// Pure marks/attributes (no ProseMirror view-plugin dependencies) shared by
// both extension lists — same reasoning as sharedNodeExtensions() above:
// content authored with any of these in the admin editor must render
// identically on public pages, so the two lists can't be allowed to drift.
export const sharedMarkExtensions = () => [
  Underline,
  Subscript,
  Superscript,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: [...TEXT_ALIGN_TYPES] }),
];

// Read-only set for PreviewContent's generateHTML() call, which runs in
// every visitor's browser on every product/service/news/page view.
// StarterKit statically imports Dropcursor/Gapcursor/UndoRedo at module
// scope regardless of its own `false` config (they're plugins, not schema,
// so getSchema() never needed them) — configuring them off never dropped
// them from the bundle, only skipped instantiating them. Those plugins pull
// in prosemirror-view's decoration/history machinery, which showed up as a
// ~127KB, ~100%-unused JS chunk in a mobile Lighthouse audit of an ad
// landing page (2026-09-23) — real weight/parse time on every public page
// for editing features a static render can never use. Building the node
// list from the individual @tiptap/extension-* packages instead (skipping
// StarterKit entirely, plus its own Dropcursor/Gapcursor/UndoRedo/
// TrailingNode/ListKeymap) — AND keeping that avoidance in a file that
// itself never imports "@tiptap/starter-kit" (see the module-boundary note
// at the top of this file) — is what actually keeps the code out of this
// bundle. The resulting schema is identical either way (those are pure
// ProseMirror plugins, not node/mark types — generateHTML's getSchema()
// never reads them), verified byte-for-byte via a throwaway vitest+jsdom
// parity check before this split (synthetic doc covering every supported
// node/mark, plus a real product description pulled from production).
export const getTiptapExtensionsForRender = () => [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Strike,
  Code,
  CodeBlock,
  Blockquote,
  HardBreak,
  Heading.configure({ levels: [...HEADING_LEVELS] }),
  BulletList,
  OrderedList,
  ListItem,
  ...sharedNodeExtensions(),
  ...sharedMarkExtensions(),
];
