"use client";

import { Button } from "@/shared/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { cn } from "@/shared/lib/utils";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { useState } from "react";

// Same "xem thêm nội dung" collapse/fade pattern as ProductDescription
// (max-height + gradient fade instead of Radix's CollapsibleContent, for a
// smoother reveal) — generalized here for non-rich-text content like the
// specs table, which has no PreviewContent to render.
export function ExpandableContent({
  children,
  collapsedClassName = "max-h-96",
}: {
  children: React.ReactNode;
  collapsedClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-500 ease-in-out",
          isOpen ? "max-h-none" : collapsedClassName,
        )}
      >
        {children}
      </div>

      {!isOpen && (
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10 bg-linear-to-t from-background via-background/90 to-transparent" />
      )}

      <div className="flex justify-center mt-8">
        <CollapsibleTrigger asChild>
          <Button variant="secondary" size="sm" className="z-20">
            {isOpen ? "Thu gọn nội dung" : "Xem thêm nội dung"}
            {isOpen ? <CaretUp /> : <CaretDown />}
          </Button>
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}
