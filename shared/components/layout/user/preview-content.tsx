import { getTiptapExtensions, normalizeTiptapJson } from "@/shared/lib/tiptap-shared";
import { cn } from "@/shared/lib/utils";
import { generateHTML } from "@tiptap/html";

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
  // Base Typography-plugin scale. Kept as a single conditional class (not
  // merged via className, e.g. "prose-lg" + caller's "prose-sm") because
  // tailwind-merge doesn't dedupe the typography plugin's prose-size
  // classes, so both would ship and the winner would depend on generated
  // CSS order rather than intent.
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
 * It uses the shared design system and Tailwind's Typography (prose) plugin.
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
        "prose dark:prose-invert max-w-none",
        size === "lg" && "prose-lg",
        size === "base" && "prose-base",
        size === "sm" && "prose-sm",
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
