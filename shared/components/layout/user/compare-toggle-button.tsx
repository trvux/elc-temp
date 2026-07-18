"use client";

import { Scales } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { useCompare, type CompareItem } from "@/shared/providers/compare-provider";

interface CompareToggleButtonProps {
  item: CompareItem;
  variant?: "button" | "checkbox";
  className?: string;
}

// "button" variant: labeled CTA next to Order/Contact on the product detail
// page. "checkbox" variant: always-visible overlay on every ProductCard,
// opposite corner from WishlistButton — both read/write the same
// CompareProvider so selecting a product anywhere feeds the same
// persistent compare tray.
export function CompareToggleButton({ item, variant = "button", className }: CompareToggleButtonProps) {
  const { isSelected, toggle } = useCompare();
  const selected = isSelected(item.id);

  if (variant === "checkbox") {
    return (
      <Checkbox
        checked={selected}
        // Only stopPropagation here (block the click from bubbling up to
        // the wrapping <Link>) — do NOT preventDefault. Radix's Checkbox
        // composes this onClick with its own internal toggle handler via
        // composeEventHandlers, which skips its internal handler (and
        // never fires onCheckedChange) if the outer handler already called
        // preventDefault. That was a real bug: the checkbox looked
        // clickable but silently did nothing most of the time.
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={() => toggle(item)}
        aria-label="Chọn để so sánh"
        className={cn("bg-background", className)}
      />
    );
  }

  return (
    <Button
      type="button"
      variant={selected ? "secondary" : "outline"}
      onClick={() => toggle(item)}
      className={className}
    >
      <Scales />
      {selected ? "Đã chọn so sánh" : "So sánh"}
    </Button>
  );
}
