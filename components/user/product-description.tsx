"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

// Design System / Style Constants
const STYLES = {
  prose: cn(
    // 1. Base & Reset
    "prose prose-neutral max-w-none dark:prose-invert",
    "prose-p:m-0 prose-headings:m-0 prose-blockquote:m-0 prose-ul:m-0 prose-ol:m-0 prose-li:m-0",

    // 2. Headings
    "prose-h1:text-4xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:leading-tight prose-h1:mb-10",
    "prose-h2:text-3xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:leading-snug prose-h2:mt-16 prose-h2:mb-6",
    "prose-h3:text-2xl prose-h3:font-semibold prose-h3:leading-snug prose-h3:mt-12 prose-h3:mb-4",
    "prose-h4:text-xl prose-h4:font-semibold prose-h4:leading-normal prose-h4:mt-8 prose-h4:mb-2",

    // 3. Paragraph
    "prose-p:text-base md:prose-p:text-lg prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:mb-8 last:prose-p:mb-0",

    // 4. Blockquote
    "prose-blockquote:border-l-4 prose-blockquote:pl-8 prose-blockquote:italic prose-blockquote:text-muted-foreground",
    "prose-blockquote:border-primary/40 prose-blockquote:leading-relaxed prose-blockquote:my-12 prose-blockquote:text-xl",

    // 5. Lists
    "prose-ul:list-disc prose-ol:list-decimal prose-ul:mb-8 prose-ol:mb-8 prose-ul:pl-6",
    "prose-li:leading-relaxed prose-li:mb-3",
    "prose-li:marker:text-primary/60",

    // // 6. Media & Tables
    "prose-img:rounded-xl prose-img:my-12",
    "prose-table:my-10 prose-table:leading-normal",
    "prose-th:border-b prose-th:px-4 prose-th:py-4 prose-th:text-left prose-th:font-bold",
    "prose-td:border-b prose-td:px-4 prose-td:py-4 prose-td:text-left",

    // 7. Inline Code
    "prose-code:relative prose-code:rounded prose-code:bg-muted prose-code:px-[0.4rem] prose-code:py-[0.2rem] prose-code:font-mono prose-code:text-sm prose-code:font-semibold prose-code:before:content-[''] prose-code:after:content-['']",

    // 8. Links
    "prose-a:text-foreground prose-a:font-medium prose-a:underline prose-a:underline-offset-4 prose-a:decoration-primary/30 hover:prose-a:decoration-primary transition-all",
  ),
  collapsible: cn(
    "overflow-hidden transition-[max-height] duration-500 ease-in-out",
  ),
  overlay: cn(
    "absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-cream via-cream/90 to-transparent pointer-events-none z-10",
  ),
  triggerWrapper: cn("mt-8 flex justify-center"),
  triggerButton: cn(
    "bg-transparent transition-all text-primary border-primary group z-20",
  ),
};

interface ProductDescriptionProps {
  content: string;
}

export function ProductDescription({ content }: ProductDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const processedContent = (content || "").replace(
    /<img(\s[^>]*?)?>/gi,
    (_match: string, attrs: string = "") => {
      const a = attrs
        .replace(/\bloading="[^"]*"/gi, "")
        .replace(/\bwidth="[^"]*"/gi, "")
        .replace(/\bheight="[^"]*"/gi, "");
      return `<img${a} loading="lazy" width="1200" height="800">`;
    },
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
      <article>
        <div
          className={cn(
            STYLES.prose,
            STYLES.collapsible,
            isOpen ? "max-h-none" : "max-h-96",
          )}
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      </article>

      {!isOpen && <div className={STYLES.overlay} />}

      <div className={STYLES.triggerWrapper}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className={STYLES.triggerButton}>
            <span className="text-xs font-bold capitalize mr-2">
              {isOpen ? "Thu gọn nội dung" : "Xem thêm nội dung"}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-foreground group-hover:text-foreground transition-colors" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}
