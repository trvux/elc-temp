import { getTiptapExtensions, normalizeTiptapJson } from "@/shared/lib/tiptap-shared";
import { cn } from "@/shared/lib/utils";
import { generateHTML } from "@tiptap/html";

interface PreviewContentProps {
  content: unknown;
  className?: string;
  hideFirstHeading?: boolean;
}

/**
 * PreviewContent component renders Tiptap JSON content into styled HTML.
 * It uses the shared design system and Tailwind's Typography (prose) plugin.
 */
export const PreviewContent = ({
  content,
  className,
  hideFirstHeading = false,
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

      // Logic: If hideFirstHeading is true, remove the first H1 node
      if (hideFirstHeading && Array.isArray(contentToRender.content)) {
        const nodes = contentToRender.content as Array<Record<string, unknown>>;
        const firstH1Index = nodes.findIndex(
          (node) =>
            node.type === "heading" &&
            (node.attrs as Record<string, unknown> | undefined)?.level === 1,
        );

        if (firstH1Index !== -1) {
          contentToRender = {
            ...contentToRender,
            content: nodes.filter((_, index) => index !== firstH1Index),
          };
        }
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
