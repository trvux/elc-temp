"use client";

import { Heart } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { formatPrice } from "@/modules/catalog/domain";
import { WishlistButton } from "@/shared/components/layout/user/wishlist-button";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/components/ui/empty";
import { cn } from "@/shared/lib/utils";
import { useWishlist } from "@/shared/providers/wishlist-provider";

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image_url: string;
    display_price: number | null;
  } | null;
}

// Replaces the old header heart icon (which linked out to a bare /yeu-thich
// page). Sits next to CompareLinkButton on listing pages instead — same
// "opt in when needed" spot — and shows the wishlist inline via Dialog so
// browsing isn't interrupted by a full page navigation to an otherwise
// mostly-empty page.
export function WishlistDialogButton({ className }: { className?: string }) {
  const { ids } = useWishlist();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;

    setIsLoading(true);
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data: { items?: WishlistItem[] }) => setItems(data.items ?? []))
      .finally(() => setIsLoading(false));
  };

  const validItems = items.filter((item) => item.product !== null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn(className)}>
          <Heart weight={ids.size > 0 ? "fill" : "regular"} className={ids.size > 0 ? "text-destructive" : ""} />
          Yêu thích{ids.size > 0 ? ` (${ids.size})` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sản phẩm yêu thích</DialogTitle>
        </DialogHeader>

        {!isLoading && validItems.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Heart />
              </EmptyMedia>
              <EmptyTitle>Chưa có sản phẩm yêu thích</EmptyTitle>
              <EmptyDescription>
                Bấm biểu tượng trái tim trên sản phẩm bất kỳ để lưu vào đây.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {validItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {validItems.map((item) => (
              <div key={item.id} className="relative flex flex-col gap-2 rounded-lg border border-border/40 p-3">
                <div className="absolute top-2 right-2 z-10">
                  <WishlistButton productId={item.product_id} />
                </div>
                <Link
                  href={`/san-pham/${item.product!.slug}`}
                  className="flex flex-col gap-2"
                  onClick={() => setOpen(false)}
                >
                  <div className="aspect-video w-full bg-white rounded-md overflow-hidden">
                    {item.product!.image_url && (
                      <Image
                        src={item.product!.image_url}
                        alt={item.product!.name}
                        width={200}
                        height={112}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <span className="text-sm font-medium line-clamp-2">{item.product!.name}</span>
                  <span className="text-sm font-bold text-destructive">
                    {item.product!.display_price ? formatPrice(item.product!.display_price) : "Liên hệ"}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
