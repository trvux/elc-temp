"use client";

import { formatPrice } from "@/modules/catalog/domain";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useRecentlyViewed } from "@/shared/hooks/use-recently-viewed";
import { XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

export function RecentlyViewedSection() {
  const { items, removeProduct, clearAll } = useRecentlyViewed();

  if (items.length === 0) return null;

  return (
    <Card className="w-full rounded-md gap-0 py-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 ">
        <CardTitle className="text-base font-semibold text-foreground">
          Sản phẩm đã xem
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Xóa lịch sử
        </Button>
      </CardHeader>
      <CardContent className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((product) => {
            const isDiscontinued =
              product.stockStatus === "discontinued" ||
              product.stockStatus === "out_of_stock";
            const price = product.salePrice || product.originalPrice || 0;
            const priceLabel = isDiscontinued
              ? "Ngừng kinh doanh"
              : formatPrice(price);

            return (
              // Wrapper div — X button lives here as a sibling to Link
              <div key={product.id} className="relative shrink-0 w-55 group">
                <Link
                  href={`/san-pham/${product.slug}`}
                  prefetch={false}
                  className="flex items-center gap-3 w-full h-full p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all"
                >
                  {/* Product image */}
                  <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-white ">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-4">
                    <span className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                      {product.name}
                    </span>
                    <span className="text-xs font-bold text-destructive">
                      {priceLabel}
                    </span>
                  </div>
                </Link>

                {/* Remove button — outside Link, no event conflict */}
                <Button
                  onClick={() => removeProduct(product.id)}
                  className="absolute top-1.5 right-1.5 z-10"
                  aria-label="Xóa sản phẩm"
                  size="icon-xs"
                  variant="secondary"
                >
                  <XIcon />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
