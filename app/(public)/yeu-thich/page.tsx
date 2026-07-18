"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/modules/catalog/domain";
import { WishlistButton } from "@/shared/components/layout/user/wishlist-button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/shared/components/ui/empty";
import { TypographyH1 } from "@/shared/components/ui/typography";
import { Heart } from "@phosphor-icons/react";

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

// Client component: fetches /api/wishlist directly (same-origin, cookie
// travels automatically) rather than going through WishlistProvider's
// ids-only state, since this page needs the full joined product summary
// (name/image/price), not just membership.
export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data: { items?: WishlistItem[] }) => setItems(data.items ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  const validItems = items.filter((item) => item.product !== null);

  return (
    <main className="w-full bg-background min-h-screen">
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-400 mx-auto">
        <TypographyH1>Sản phẩm yêu thích</TypographyH1>

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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {validItems.map((item) => (
            <div key={item.id} className="relative flex flex-col gap-2 rounded-lg border border-border/40 p-3">
              <div className="absolute top-2 right-2 z-10">
                <WishlistButton productId={item.product_id} />
              </div>
              <Link href={`/san-pham/${item.product!.slug}`} className="flex flex-col gap-2">
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
      </div>
    </main>
  );
}
