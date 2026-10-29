"use client";

import { formatPrice } from "@/modules/catalog/domain";
import {
  Card,
  CardContent,
  CardHeader,
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
    <section aria-labelledby="recently-viewed-heading">
    <Card className="w-full rounded-md gap-0 py-0 overflow-hidden">
      <CardHeader className="px-4 py-3">
        <h2 id="recently-viewed-heading" className="type-body-strong text-foreground">
          Sản phẩm đã xem
        </h2>
      </CardHeader>
      <CardContent className="px-4 py-3">
        <ul className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((product) => (
            <li key={product.id} className="shrink-0">
            <Link
              href={`/san-pham/${product.slug}`}
              prefetch={false}
              className="flex items-center gap-3 w-55 p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-white">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt=""
                    width={56}
                    height={56}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>

              <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-4">
                <span className="type-legal text-foreground line-clamp-2">
                  {product.name}
                </span>
                <span className="type-tag text-destructive">
                  {product.displayPrice ? formatPrice(product.displayPrice) : "Liên hệ"}
                </span>
              </div>
            </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
    </section>
  );
}
