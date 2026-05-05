import { getTiptapExtensions } from "@/shared/lib/tiptap-shared";
import { cn } from "@/shared/lib/utils";
import { generateHTML } from "@tiptap/html";

interface PreviewContentProps {
  content: any;
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
      content.type === "doc"
    ) {
      let contentToRender = content;

      // Logic: If hideFirstHeading is true, remove the first H1 node
      if (hideFirstHeading && Array.isArray(content.content)) {
        const firstH1Index = content.content.findIndex(
          (node: any) => node.type === "heading" && node.attrs?.level === 1,
        );

        if (firstH1Index !== -1) {
          contentToRender = {
            ...content,
            content: content.content.filter(
              (_: any, index: number) => index !== firstH1Index,
            ),
          };
        }
      }

      html = generateHTML(contentToRender, getTiptapExtensions());
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
        // "prose-headings:font-newsreader prose-headings:font-medium",
        "prose-img:rounded-sm",
        "tiptap",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
