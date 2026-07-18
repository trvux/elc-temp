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
// page. "checkbox" variant: overlay on a ProductCard grid, opposite corner
// from WishlistButton — both read/write the same CompareProvider so
// selecting a product anywhere feeds the same persistent compare tray.
export function CompareToggleButton({ item, variant = "button", className }: CompareToggleButtonProps) {
  const { isSelected, toggle, isSelecting } = useCompare();
  const selected = isSelected(item.id);

  if (variant === "checkbox") {
    // Only visible once the listing page's "So sánh sản phẩm" mode is on
    // (see CompareModeToggle) — otherwise every ProductCard would show a
    // checkbox all the time.
    if (!isSelecting) return null;

    return (
      <Checkbox
        checked={selected}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
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

// Listing-page trigger that turns on the per-card checkbox overlay above —
// hidden entirely once fewer than 2 published products exist on the page,
// since comparing is meaningless with 0-1 products.
export function CompareModeToggle({ className }: { className?: string }) {
  const { isSelecting, setIsSelecting } = useCompare();

  return (
    <Button
      type="button"
      variant={isSelecting ? "secondary" : "outline"}
      onClick={() => setIsSelecting(!isSelecting)}
      className={className}
    >
      <Scales />
      {isSelecting ? "Xong" : "So sánh sản phẩm"}
    </Button>
  );
}
