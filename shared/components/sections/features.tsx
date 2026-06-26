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
  TypographyH4,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]";

function getTargetRows(cols: number) {
  if (cols <= 2) return 5; // mobile
  if (cols <= 4) return 4; // tablet
  return 3; // desktop
}

interface FeaturesSectionProps {
  title: string;
  slug: string;
  products: Product[];
  categoryId?: string;
  totalCount?: number;
}

export function FeaturesSection({
  title,
  slug,
  products: initialProducts,
  categoryId,
  totalCount = initialProducts.length,
}: FeaturesSectionProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const colsRef = useRef(2);
  const pageSizeRef = useRef(Math.max(initialProducts.length, 12));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const loadedCountRef = useRef(initialProducts.length);
  const hasMoreRef = useRef(initialProducts.length < totalCount);
  const loadingRef = useRef(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!categoryId || !gridRef.current) return;
    const grid = gridRef.current;
    const update = () => {
      const cols = window
        .getComputedStyle(grid)
        .gridTemplateColumns.split(" ").length;
      colsRef.current = cols;
      pageSizeRef.current = cols * getTargetRows(cols);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [categoryId]);

  const autoFill = useCallback(async () => {
    if (!categoryId || loadingRef.current || !hasMoreRef.current) return;
    const toLoad = pageSizeRef.current - loadedCountRef.current;
    if (toLoad <= 0) {
      setIsAutoLoading(false);
      return;
    }
    loadingRef.current = true;
    setIsAutoLoading(true);
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
      setIsAutoLoading(false);
    }
    if (hasMoreRef.current && loadedCountRef.current < pageSizeRef.current) {
      setTimeout(autoFill, 0);
    }
  }, [categoryId]);

  // Only trigger autoFill when section scrolls into viewport (200px lookahead)
  useEffect(() => {
    if (!categoryId) return;
    const container = containerRef.current;
    if (!container || !hasMoreRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggeredRef.current) {
          triggeredRef.current = true;
          observer.disconnect();
          autoFill();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = totalCount - products.length;
  const hasMore = !!categoryId && products.length < totalCount;
  // Each click loads exactly cols × targetRows (1 "page" of full rows)
  const loadBatch = colsRef.current * getTargetRows(colsRef.current);

  const loadMore = async () => {
    if (!categoryId) return;
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

  const skeletonCount = isAutoLoading
    ? Math.max(pageSizeRef.current - loadedCountRef.current, 2)
    : 0;

  const isShowingProducts = products.length > 0 || isAutoLoading;

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-center gap-8">
      <StaggerContainer className="w-full" immediate>
        <div className="flex flex-col gap-3">
          <StaggerItem>
            <Button asChild variant="secondary">
              <Link
                href={`/san-pham/${slug}`}
                className="group relative inline-flex items-center justify-center transition-colors p-2"
              >
                <TypographyH4>{title}</TypographyH4>
              </Link>
            </Button>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {isShowingProducts ? (
        <div className="w-full flex flex-col gap-4">
          <div ref={gridRef} className={GRID_CLASS}>
            {products.map((product, i) => (
              <div key={product.id} className="text-foreground h-full">
                <ProductCard product={product} priority={i < 8} />
              </div>
            ))}
            {isAutoLoading &&
              Array.from({ length: skeletonCount }).map((_, i) => (
                <div key={`sk-${i}`} className="flex flex-col gap-4">
                  <Skeleton className="aspect-video w-full rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                  <Skeleton className="h-6 w-1/3" />
                </div>
              ))}
          </div>

          {hasMore && !isAutoLoading && (
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
