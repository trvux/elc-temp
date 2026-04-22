import { generateHTML } from "@tiptap/html";
import { getTiptapExtensions } from "@/lib/tiptap-shared";
import { cn } from "@/lib/utils";

interface PreviewContentProps {
  content: any;
  className?: string;
}

/**
 * PreviewContent component renders Tiptap JSON content into styled HTML.
 * It uses the shared design system and Tailwind's Typography (prose) plugin.
 */
export const PreviewContent = ({ content, className }: PreviewContentProps) => {
  if (!content) return null;

  let html = "";

  try {
    // If the content is already HTML (legacy), use it directly.
    // If it's an object, convert it to HTML using shared extensions.
    if (typeof content === "string") {
      html = content;
    } else if (content && typeof content === "object" && content.type === "doc") {
      html = generateHTML(content, getTiptapExtensions());
    } else {
      // If it's an object but not a valid Tiptap doc, return empty or handle safely
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
        "prose-headings:font-newsreader prose-headings:font-medium",
        "prose-img:rounded-sm",
        "tiptap", // For global styles in globals.css (tables, etc.)
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
