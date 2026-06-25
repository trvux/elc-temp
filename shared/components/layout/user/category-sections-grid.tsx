"use client";

import type { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Spinner } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]";

// mobile (≤2 cols) → 5 rows | tablet (3–4 cols) → 4 rows | desktop (≥5 cols) → 3 rows
function getTargetRows(cols: number) {
  if (cols <= 2) return 5;
  if (cols <= 4) return 4;
  return 3;
}

export type CategorySectionData = {
  categoryId: string;
  initialProducts: ProductWithRelations[];
  totalCount: number;
};

function CategorySection({
  categoryId,
  initialProducts,
  totalCount,
  queryTokens,
}: CategorySectionData & { queryTokens: string[] }) {
  const [products, setProducts] = useState(initialProducts);
  // Show skeletons immediately on mount if there are products to load
  const [isAutoLoading, setIsAutoLoading] = useState(
    initialProducts.length < totalCount,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const colsRef = useRef(2);
  // Default 12 before ResizeObserver measures; updated to cols × targetRows
  const pageSizeRef = useRef(Math.max(initialProducts.length, 12));
  const gridRef = useRef<HTMLDivElement | null>(null);
  const loadedCountRef = useRef(initialProducts.length);
  const hasMoreRef = useRef(initialProducts.length < totalCount);
  const loadingRef = useRef(false);

  // Measure real column count → compute exact target (cols × targetRows)
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
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
  }, []);

  // Auto-fill: load exactly enough products to reach cols × targetRows (full rows)
  const autoFill = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
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
        products: ProductWithRelations[];
        hasMore: boolean;
      };
      setProducts((prev) => [...prev, ...data.products]);
      loadedCountRef.current += data.products.length;
      hasMoreRef.current = data.hasMore;
    } finally {
      loadingRef.current = false;
      setIsAutoLoading(false);
    }
    // Chain if still under target (API returned fewer than requested)
    if (hasMoreRef.current && loadedCountRef.current < pageSizeRef.current) {
      setTimeout(autoFill, 0);
    }
  }, [categoryId]);

  // ResizeObserver effect runs first → pageSizeRef is set before autoFill reads it
  useEffect(() => {
    autoFill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = totalCount - products.length;
  const hasMore = products.length < totalCount;
  // Each click loads exactly cols × targetRows (1 "page" of full rows)
  const loadBatch = colsRef.current * getTargetRows(colsRef.current);

  const loadMore = async () => {
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
        products: ProductWithRelations[];
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

  return (
    <div className="flex flex-col gap-4">
      <div ref={gridRef} className={GRID_CLASS}>
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            queryTokens={queryTokens}
            priority={i < 8}
          />
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
  );
}

export function CategorySectionsGrid({
  sections,
  queryTokens = [],
}: {
  sections: CategorySectionData[];
  queryTokens?: string[];
}) {
  if (sections.length === 0) {
    return (
      <div className="py-24 text-center min-h-75 w-full">
        <p className="text-muted-foreground/60 italic text-sm">
          Không tìm thấy sản phẩm nào.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section, i) => (
        <div key={section.categoryId} className="flex flex-col gap-6">
          <CategorySection {...section} queryTokens={queryTokens} />
          {i < sections.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}
