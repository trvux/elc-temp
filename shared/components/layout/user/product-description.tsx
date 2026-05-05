"use client";

import { Button } from "@/shared/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { cn } from "@/shared/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";

// Design System / Style Constants
const STYLES = {
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
  content: any;
}

export function ProductDescription({ content }: ProductDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
      <article>
        <PreviewContent 
          content={content} 
          hideFirstHeading={true}
          className={cn(
            STYLES.collapsible,
            isOpen ? "max-h-none" : "max-h-96"
          )}
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
