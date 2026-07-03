import { getTiptapExtensions, normalizeTiptapJson } from "@/shared/lib/tiptap-shared";
import { cn } from "@/shared/lib/utils";
import { generateHTML } from "@tiptap/html";

interface PreviewContentProps {
  content: unknown;
  className?: string;
  hideFirstHeading?: boolean;
  skipFirstHeadingPromotion?: boolean;
  demoteHeadingOne?: boolean;
  // Editors have an "Alt text" control in the rich-text editor (image bubble menu),
  // but it's tucked in a popover and easy to skip — most authored images end up with
  // no alt at all, which is a dead end for image search and screen readers. Rather
  // than depend on a content backfill across every existing article/product, fall
  // back to this page-level name (product/article/page title) for any image node
  // that shipped without one, applied at render time so it covers old content too.
  fallbackAlt?: string;
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

function isLevelOneHeading(node: Record<string, unknown>): boolean {
  return (
    node.type === "heading" &&
    (node.attrs as Record<string, unknown> | undefined)?.level === 1
  );
}

function demoteLevelOneHeadings(
  nodes: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return nodes.map((node) =>
    isLevelOneHeading(node)
      ? {
          ...node,
          attrs: { ...(node.attrs as Record<string, unknown>), level: 2 },
        }
      : node,
  );
}

/**
 * PreviewContent component renders Tiptap JSON content into styled HTML.
 * It uses the shared design system and Tailwind's Typography (prose) plugin.
 */
export const PreviewContent = ({
  content,
  className,
  hideFirstHeading = false,
  skipFirstHeadingPromotion = false,
  demoteHeadingOne = false,
  fallbackAlt,
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
      let contentToRender = normalizeTiptapJson(content, { skipFirstHeadingPromotion }) as Record<string, unknown>;

      // hideFirstHeading: this content sits under a page whose own <h1> already
      // duplicates the CMS's auto-promoted first heading (e.g. article title) —
      // drop that first H1 node entirely, then demote any other stray H1 an
      // editor may have picked further down in the body to H2.
      if (hideFirstHeading && Array.isArray(contentToRender.content)) {
        const nodes = contentToRender.content as Array<Record<string, unknown>>;
        const firstH1Index = nodes.findIndex(isLevelOneHeading);

        const withoutFirstH1 =
          firstH1Index !== -1
            ? nodes.filter((_, index) => index !== firstH1Index)
            : nodes;

        contentToRender = {
          ...contentToRender,
          content: demoteLevelOneHeadings(withoutFirstH1),
        };
      }

      // demoteHeadingOne: this content is a secondary block on a page that has
      // its own <h1> elsewhere, but (unlike hideFirstHeading) any H1 authored
      // here is real, distinct copy — not a duplicate of the page title — so it
      // should stay visible, just demoted to H2 instead of being deleted.
      if (demoteHeadingOne && Array.isArray(contentToRender.content)) {
        contentToRender = {
          ...contentToRender,
          content: demoteLevelOneHeadings(
            contentToRender.content as Array<Record<string, unknown>>,
          ),
        };
      }

      if (fallbackAlt) {
        contentToRender = fillMissingImageAlt(contentToRender, fallbackAlt);
      }

      html = generateHTML(contentToRender as Parameters<typeof generateHTML>[0], getTiptapExtensions());
    } else {
      console.warn("Invalid content format received by PreviewContent");
      return null;
    }
  } catch (error) {
    console.error("Failed to render content:", error);
    return null;
  }

  return (
    <div
      className={cn(
        "prose prose-lg dark:prose-invert max-w-none",
        "prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-img:rounded-sm",
        "tiptap",
        className,
      )}
      dangerouslySetInnerHTML={{ 
        __html: html.replace(/<table/g, '<div class="table-wrapper"><table').replace(/<\/table>/g, '</table></div>') 
      }}
    />
  );
};
