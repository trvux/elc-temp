"use client";

import { Heart } from "@phosphor-icons/react";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { useWishlist } from "@/shared/providers/wishlist-provider";

// Previously there was no way to reach /yeu-thich at all — the heart button
// toggled state with no visible destination. This gives the wishlist a
// permanent, discoverable home in the header, with a live count badge.
export function HeaderWishlistLink() {
  const { ids } = useWishlist();
  const count = ids.size;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-md hover:bg-muted"
      asChild
    >
      <Link href="/yeu-thich" aria-label="Sản phẩm yêu thích">
        <Heart weight={count > 0 ? "fill" : "regular"} className={count > 0 ? "text-destructive" : ""} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold leading-none text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
