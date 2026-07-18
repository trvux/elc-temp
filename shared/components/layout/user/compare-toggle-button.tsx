"use client";

import { Scales } from "@phosphor-icons/react";
import { m } from "motion/react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useCompare, type CompareItem } from "@/shared/providers/compare-provider";

interface CompareToggleButtonProps {
  item: CompareItem;
  variant?: "button" | "icon";
  className?: string;
}

// "button" variant: labeled CTA next to Order/Contact on the product detail
// page. "icon" variant: always-visible overlay on every ProductCard,
// opposite corner from WishlistButton — a real toggle button (filled when
// selected), not a checkbox (too small to tap reliably, and a checkbox
// nested inside the card's <Link> caused real click-handling bugs — see
// ProductCard.tsx, which now renders both overlay buttons as siblings of
// the Link rather than nested inside it). Both read/write the same
// CompareProvider so selecting a product anywhere feeds the same
// persistent compare tray.
export function CompareToggleButton({ item, variant = "button", className }: CompareToggleButtonProps) {
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
          <Scales weight={selected ? "fill" : "regular"} />
        </m.button>
      </Button>
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
