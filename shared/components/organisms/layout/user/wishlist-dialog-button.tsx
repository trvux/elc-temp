"use client";

import { Heart } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useWishlist } from "@/shared/providers/wishlist-provider";

// Trigger only — the actual Dialog/Drawer is WishlistDialog, mounted once
// globally so the "Xem danh sách" toast action (fired from anywhere a
// wishlist toggle happens) can open the same instance via WishlistProvider's
// isDialogOpen state, instead of navigating to the old /yeu-thich page.
export function WishlistDialogButton({ className }: { className?: string }) {
  const { ids, setDialogOpen } = useWishlist();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(className)}
      onClick={() => setDialogOpen(true)}
    >
      <Heart weight={ids.size > 0 ? "fill" : "regular"} className={ids.size > 0 ? "text-destructive" : ""} />
      Yêu thích{ids.size > 0 ? ` (${ids.size})` : ""}
    </Button>
  );
}
