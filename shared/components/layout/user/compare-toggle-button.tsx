"use client";

import { ColumnsPlusRight } from "@phosphor-icons/react";
import { m } from "motion/react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useCompare, type CompareItem } from "@/shared/providers/compare-provider";

interface CompareToggleButtonProps {
  item: CompareItem;
  variant?: "button" | "icon";
  size?: "default" | "sm";
  className?: string;
}

// "button" variant: labeled CTA next to Order/Contact on the product detail
// page. "icon" variant: compact circular button in ProductCard's footer,
// next to the full-width WishlistButton — kept small and icon-only there so
// the two footer controls read as one primary action (wishlist) + one
// secondary toggle (compare), not two competing labeled buttons. Both
// variants read/write the same CompareProvider so selecting a product
// anywhere feeds the same persistent compare tray.
export function CompareToggleButton({ item, variant = "button", size = "default", className }: CompareToggleButtonProps) {
  const { isSelected, toggle } = useCompare();
  const selected = isSelected(item.id);

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        className={cn("rounded-full", selected && "bg-primary text-primary-foreground hover:bg-primary/90", className)}
        aria-label={selected ? "Bỏ khỏi so sánh" : "Thêm vào so sánh"}
        aria-pressed={selected}
        onClick={() => toggle(item)}
        asChild
      >
        <m.button whileTap={{ scale: 0.85 }}>
          <ColumnsPlusRight weight={selected ? "fill" : "regular"} />
        </m.button>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={selected ? "secondary" : "outline"}
      size={size}
      onClick={() => toggle(item)}
      className={className}
    >
      <ColumnsPlusRight />
      {selected ? "Đã chọn" : "So sánh"}
    </Button>
  );
}
