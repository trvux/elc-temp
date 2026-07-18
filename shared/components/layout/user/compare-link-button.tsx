"use client";

import { Scales } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useCompare } from "@/shared/providers/compare-provider";

// Sits next to the listing page's H1, alongside WishlistDialogButton — the
// same row reserves space for a future "Lọc" (filter) button once
// facet/filter search ships. Not a mode toggle: it's a direct shortcut into
// /san-pham/so-sanh using whatever products are already queued via each
// card's own CompareToggleButton, so the user doesn't have to scroll down
// to find CompareTray once they've picked their products.
export function CompareLinkButton({ className }: { className?: string }) {
  const { items } = useCompare();
  const router = useRouter();

  const handleClick = () => {
    if (items.length < 2) {
      toast.error("Chọn ít nhất 2 sản phẩm để so sánh");
      return;
    }
    router.push(`/san-pham/so-sanh?ids=${items.map((i) => i.id).join(",")}`);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} className={cn(className)}>
      <Scales />
      So sánh{items.length > 0 ? ` (${items.length})` : ""}
    </Button>
  );
}
