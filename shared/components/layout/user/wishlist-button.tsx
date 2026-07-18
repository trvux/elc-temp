"use client";

import { Heart } from "@phosphor-icons/react";
import { m } from "motion/react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useWishlist } from "@/shared/providers/wishlist-provider";

interface WishlistButtonProps {
  productId: string;
  size?: "icon-xs" | "icon-sm" | "icon" | "icon-lg";
  className?: string;
}

// The single most "buying-intent" affordance on the page — used on
// ProductCard, the product detail hero, and the floating CTA bar, all
// reading/writing the same WishlistProvider so toggling anywhere stays in
// sync everywhere. Must stopPropagation/preventDefault when nested inside a
// <Link> (ProductCard wraps the whole card in one) so tapping the heart
// doesn't also navigate.
export function WishlistButton({ productId, size = "icon-sm", className }: WishlistButtonProps) {
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(productId);

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      className={cn("rounded-full", className)}
      aria-label={wishlisted ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
      aria-pressed={wishlisted}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      asChild
    >
      <m.button
        whileTap={{ scale: 0.85 }}
        animate={wishlisted ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart weight={wishlisted ? "fill" : "regular"} className={wishlisted ? "text-destructive" : ""} />
      </m.button>
    </Button>
  );
}
