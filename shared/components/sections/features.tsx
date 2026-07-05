"use client";

import { Button } from "@/components/ui/button";
import { ProductWithRelations as Product } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TypographyH3,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

interface FeaturesSectionProps {
  title: string;
  slug: string;
  products: Product[];
  categoryId?: string;
  totalCount?: number;
  priorityCount?: number;
}

export function FeaturesSection({
  title,
  slug,
  products: initialProducts,
  categoryId,
  totalCount = initialProducts.length,
  priorityCount = 0,
}: FeaturesSectionProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadedCountRef = useRef(initialProducts.length);
  const hasMoreRef = useRef(initialProducts.length < totalCount);
  const loadingRef = useRef(false);

  const remaining = totalCount - products.length;
  const hasMore = !!categoryId && products.length < totalCount;
  const loadBatch = 12; // Load exactly 12 products per click for perfect grid alignment

  const loadMore = async () => {
    if (!categoryId || loadingRef.current) return;
    const toLoad = Math.min(remaining, loadBatch);
    loadingRef.current = true;
    setIsLoadingMore(true);
    try {
      const sp = new URLSearchParams({
        entityType: "category",
        entityId: categoryId,
        offset: String(loadedCountRef.current),
        limit: String(toLoad),
      });
      const res = await fetch(`/api/products?${sp.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        products: Product[];
        hasMore: boolean;
      };
      setProducts((prev) => [...prev, ...data.products]);
      loadedCountRef.current += data.products.length;
      hasMoreRef.current = data.hasMore;
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  };

  const isShowingProducts = products.length > 0;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <StaggerContainer className="w-full" immediate>
        <div className="flex flex-col gap-3">
          <StaggerItem>
            <Button asChild variant="secondary">
              <Link
                href={`/san-pham/${slug}`}
                className="group relative inline-flex items-center justify-center transition-colors p-2"
              >
                <TypographyH3>{title}</TypographyH3>
              </Link>
            </Button>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {isShowingProducts ? (
        <div className="w-full flex flex-col gap-4">
          <div className={GRID_CLASS}>
            {products.map((product, i) => (
              <div key={product.id} className="text-foreground h-full">
                <ProductCard product={product} priority={i < priorityCount} />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-1">
              <Button
                variant="outline"
                size="lg"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                {isLoadingMore ? (
                  <>
                    <Spinner className="size-3.5 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  `Hiển thị thêm ${remaining} sản phẩm`
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <AnimateIn className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground border border-dashed rounded-xl bg-muted/30 w-full">
          <TypographyMuted>Đang tải sản phẩm...</TypographyMuted>
        </AnimateIn>
      )}
    </div>
  );
}
