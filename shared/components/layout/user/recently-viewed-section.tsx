"use client";

import { formatPrice } from "@/modules/catalog/domain";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useRecentlyViewed } from "@/shared/hooks/use-recently-viewed";
import Image from "next/image";
import Link from "next/link";

// Read-only — the backend (/recently-viewed) only supports GET (list) and
// POST (record a view), no per-item delete or clear-all, so this list
// naturally ages out of the top-20 by viewed_at instead of being manually
// curated, same as most real e-commerce sites.
export function RecentlyViewedSection() {
  const { items, isLoading } = useRecentlyViewed();

  if (isLoading || items.length === 0) return null;

  return (
    <Card className="w-full rounded-md gap-0 py-0 overflow-hidden">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Sản phẩm đã xem
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((product) => (
            <Link
              key={product.id}
              href={`/san-pham/${product.slug}`}
              prefetch={false}
              className="flex items-center gap-3 shrink-0 w-55 p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-white">
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

              <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-4">
                <span className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                  {product.name}
                </span>
                <span className="text-xs font-bold text-destructive">
                  {product.displayPrice ? formatPrice(product.displayPrice) : "Liên hệ"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
