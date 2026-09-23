import { getTiptapExtensionsForRender, normalizeTiptapJson } from "@/shared/lib/tiptap-render";
import { cn } from "@/shared/lib/utils";
// Server-side generateHTML (happy-dom, runs in Node) instead of
// "@tiptap/html"'s browser version — @tiptap/core itself (needed by
// either import path, for getSchema()) statically imports EditorView
// from "@tiptap/pm/view" at module scope, regardless of which tiptap
// extensions are actually used. That's harmless here: this file has no
// "use client" of its own, and every caller now renders it from a Server
// Component (passing the result down as `children` into whatever client
// wrapper needs collapse/other interactivity — see product-description.tsx)
// instead of importing/calling it directly inside a client module. So the
// whole tiptap/prosemirror dependency graph — the actual weight, not just
// StarterKit's slice of it — now runs only in Node and never reaches the
// browser bundle at all. Confirmed via mobile Lighthouse audit
// (2026-09-23/24): a ~127KB, ~100%-unused JS chunk on a public product/
// service page survived TWO earlier attempts that only changed which
// tiptap extensions were imported (first same-file, then split into
// tiptap-render.ts) — it never budged, because neither attempt touched
// the real cause: @tiptap/html's browser generateHTML always drags in
// @tiptap/core's EditorView import no matter what.
import { generateHTML } from "@tiptap/html/server";
import { WithLinkPreview } from "@/shared/components/organisms/link-preview/with-link-preview";

interface PreviewContentProps {
  content: unknown;
  className?: string;
  // Editors have an "Alt text" control in the rich-text editor (image bubble menu),
  // but it's tucked in a popover and easy to skip — most authored images end up with
  // no alt at all, which is a dead end for image search and screen readers. Rather
  // than depend on a content backfill across every existing article/product, fall
  // back to this page-level name (product/article/page title) for any image node
  // that shipped without one, applied at render time so it covers old content too.
  fallbackAlt?: string;
  // Base typeset scale, expressed as --typeset-size (px). Kept as a size
  // keyword (not a raw className) so callers can't collide with the
  // typeset-docs preset's own --typeset-size declaration via specificity.
  size?: "sm" | "base" | "lg";
}

function fillMissingImageAlt(
  node: Record<string, unknown>,
  fallbackAlt: string,
): Record<string, unknown> {
  const attrs = node.attrs as Record<string, unknown> | undefined;
  const content = Array.isArray(node.content)
    ? (node.content as Array<Record<string, unknown>>).map((child) =>
        fillMissingImageAlt(child, fallbackAlt),
      )
    : undefined;

  if (node.type === "image" && !(attrs?.alt && String(attrs.alt).trim())) {
    return {
      ...node,
      attrs: { ...attrs, alt: fallbackAlt },
      ...(content !== undefined ? { content } : {}),
    };
  }

  return content !== undefined ? { ...node, content } : node;
}

/**
 * PreviewContent component renders Tiptap JSON content into styled HTML.
 * It uses the shared design system and shadcn/typeset.
 *
 * Body content never contains an <h1> — the page's own title is always a
 * separate structured field, rendered elsewhere by the caller. Headings
 * authored here start at H2 (enforced by getTiptapExtensions' heading
 * levels), so no first-heading hide/demote/promote logic is needed.
 */
export const PreviewContent = ({
  content,
  className,
  fallbackAlt,
  size = "lg",
}: PreviewContentProps) => {
  if (!content) return null;

  let html = "";

  try {
    if (typeof content === "string") {
      html = content;
    } else if (
      content &&
      typeof content === "object" &&
      (content as Record<string, unknown>).type === "doc"
    ) {
      // Normalize heading nodes that were stored without attrs.level (legacy DB records)
      let contentToRender = normalizeTiptapJson(content) as Record<string, unknown>;

      if (fallbackAlt) {
        contentToRender = fillMissingImageAlt(contentToRender, fallbackAlt);
      }

      html = generateHTML(contentToRender as Parameters<typeof generateHTML>[0], getTiptapExtensionsForRender());
    } else {
      console.warn("Invalid content format received by PreviewContent");
      return null;
    }
  } catch (error) {
    console.error("Failed to render content:", error);
    return null;
  }

  return (
    <WithLinkPreview className="contents">
      <div
        className={cn(
          "typeset typeset-docs max-w-none",
          size === "lg" && "typeset-lg",
          size === "sm" && "typeset-sm",
          "tiptap",
          className,
        )}
        dangerouslySetInnerHTML={{
          __html: html.replace(/<table/g, '<div class="table-wrapper"><table').replace(/<\/table>/g, '</table></div>')
        }}
      />
    </WithLinkPreview>
  );
};
