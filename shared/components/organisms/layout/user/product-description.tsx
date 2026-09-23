"use client";

import { Button } from "@/shared/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { cn } from "@/shared/lib/utils";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { useState } from "react";

interface ProductDescriptionProps {
  // The rendered rich-text content (a Server Component's <PreviewContent />
  // output), passed down as children instead of a `content` prop — so the
  // actual tiptap/prosemirror HTML generation runs on the server, in the
  // caller's Server Component tree, and never gets pulled into this
  // client bundle. See preview-content.tsx for why that split matters.
  children: React.ReactNode;
  // "article" (default): full-width prose, used where the content IS the
  // primary reading material (product/service detail description tabs).
  // "hero": supplementary SEO copy on listing pages (category/brand/group,
  // the /san-pham hub) — low-priority reading material. Renders after the
  // product grid (not before — the buyer wants products first, this is
  // only for whoever wants to read more), in a muted, quiet card with a
  // small type scale so it doesn't compete with the page's real H1 or the
  // products above it.
  variant?: "article" | "hero";
}

export function ProductDescription({ children, variant = "article" }: ProductDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isHero = variant === "hero";

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("relative", isHero && "rounded-lg border border-border/40 bg-muted p-4 md:p-6")}
    >
      <article
        className={cn(
          "overflow-hidden transition-[max-height] duration-500 ease-in-out",
          isOpen ? "max-h-none" : "max-h-96",
        )}
      >
        {children}
      </article>

      {!isOpen && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10 bg-linear-to-t to-transparent",
            isHero ? "from-muted via-muted/90" : "from-background via-background/90",
          )}
        />
      )}

      <div className={cn("flex justify-center", isHero ? "mt-4" : "mt-8")}>
        <CollapsibleTrigger asChild>
          <Button
            variant={isHero ? "ghost" : "secondary"}
            size={isHero ? "sm" : "default"}
            className={cn("z-20", isHero && "text-muted-foreground hover:text-foreground")}
          >
            {isOpen ? "Thu gọn nội dung" : "Xem thêm nội dung"}
            {isOpen ? <CaretUp /> : <CaretDown />}
          </Button>
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}
