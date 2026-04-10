"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProductDescriptionProps {
  content: string;
}

export function ProductDescription({ content }: ProductDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
      <div
        className={`prose prose-zinc max-w-none text-sm leading-relaxed
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-base prose-h3:text-sm
          prose-p:text-muted-foreground prose-p:mb-4
          prose-strong:text-foreground prose-strong:font-semibold
          prose-img:w-full prose-img:h-auto prose-img:rounded-lg prose-img:my-4
          prose-ul:text-muted-foreground prose-li:my-1
          overflow-hidden transition-[max-height] duration-500 ease-in-out
          ${isOpen ? "max-h-[9999px]" : "max-h-[600px]"}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {!isOpen && (
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-cream via-cream/90 to-transparent pointer-events-none z-10" />
      )}

      <div className="mt-8 flex justify-center">
        <CollapsibleTrigger asChild>
          <Button className=" bg-transparent transition-all text-primary border-primary group z-20">
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
