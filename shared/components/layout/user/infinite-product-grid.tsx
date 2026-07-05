"use client";

import type { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

interface FetchParams {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  brandIds?: string[];
  condition?: string;
  specs?: Record<string, string[]>;
  entityType?: "category" | "brand" | "group";
  entityId?: string;
}

interface InfiniteProductGridProps {
  initialProducts: ProductWithRelations[];
  totalCount: number;
  fetchParams: FetchParams;
  queryTokens?: string[];
  /** Offset `initialProducts` starts at (e.g. page 2 of a paginated listing starts at offset 30).
   * Scroll-loading continues forward from here instead of always assuming page 1. */
  initialOffset?: number;
}

function buildSearchParams(params: FetchParams, offset: number, limit: number): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.minPrice !== undefined) sp.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) sp.set("maxPrice", String(params.maxPrice));
  if (params.condition) sp.set("condition", params.condition);
  if (params.entityType) sp.set("entityType", params.entityType);
  if (params.entityId) sp.set("entityId", params.entityId);
  params.brands?.forEach((b) => sp.append("brands", b));
  params.brandIds?.forEach((b) => sp.append("brandIds", b));
  if (params.specs) {
    Object.entries(params.specs).forEach(([label, values]) => {
      values.forEach((v) => sp.append(`spec_${label}`, v));
    });
  }
  sp.set("offset", String(offset));
  sp.set("limit", String(limit));
  return sp;
}

function serializeParams(params: FetchParams): string {
  return JSON.stringify({
    q: params.q ?? "",
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    brands: [...(params.brands ?? [])].sort(),
    brandIds: [...(params.brandIds ?? [])].sort(),
    condition: params.condition,
    entityType: params.entityType,
    entityId: params.entityId,
    specs: params.specs
      ? Object.fromEntries(
          Object.entries(params.specs)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => [k, [...v].sort()]),
        )
      : {},
  });
}

export function InfiniteProductGrid({
  initialProducts,
  totalCount,
  fetchParams,
  queryTokens = [],
  initialOffset = 0,
}: InfiniteProductGridProps) {
  const initialLoadedCount = initialOffset + initialProducts.length;
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
  const [hasMore, setHasMore] = useState(initialLoadedCount < totalCount);
  const [isLoading, setIsLoading] = useState(false);

  // Refs so loadMore never becomes stale from state changes
  const hasMoreRef = useRef(initialLoadedCount < totalCount);
  const pageSizeRef = useRef(30); // 30 matching the server PAGE_SIZE for exact URL state sync
  const loadedCountRef = useRef(initialLoadedCount);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const paramsKeyRef = useRef(serializeParams(fetchParams));

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const sp = buildSearchParams(fetchParams, loadedCountRef.current, pageSizeRef.current);
      const res = await fetch(`/api/products?${sp.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        products: ProductWithRelations[];
        hasMore: boolean;
        offset: number;
      };
      setProducts((prev) => [...prev, ...data.products]);
      loadedCountRef.current += data.products.length;
      hasMoreRef.current = data.hasMore;
      setHasMore(data.hasMore);

      // Sync active page state in the browser search parameters (shallow routing)
      const nextPage = Math.ceil(loadedCountRef.current / 30);
      const currentUrlParams = new URLSearchParams(window.location.search);
      currentUrlParams.set("page", String(nextPage));
      window.history.pushState(null, "", `?${currentUrlParams.toString()}`);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [fetchParams]);

  // Reset state when filters or search term changes
  useEffect(() => {
    const newKey = serializeParams(fetchParams);
    if (newKey !== paramsKeyRef.current) {
      paramsKeyRef.current = newKey;
      setProducts(initialProducts);
      loadedCountRef.current = initialProducts.length;
      loadingRef.current = false;
      hasMoreRef.current = initialProducts.length < totalCount;
      setHasMore(initialProducts.length < totalCount);
    }
  }, [fetchParams, initialProducts, totalCount]);

  const remainingCount = Math.min(totalCount - products.length, pageSizeRef.current);

  return (
    <div className="w-full flex flex-col gap-8">
      {products.length > 0 || isLoading ? (
        <div ref={gridRef} className={GRID_CLASS}>
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              queryTokens={queryTokens}
              priority={index < 8}
            />
          ))}
          {isLoading &&
            Array.from({ length: remainingCount }).map((_, i) => (
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
      ) : (
        <div className="py-24 text-center min-h-[300px] w-full animate-fade-in-up">
          <p className="text-muted-foreground/60 italic text-sm">
            Không tìm thấy sản phẩm phù hợp.
          </p>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-8 pb-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
            className="px-8 py-5 text-sm font-semibold rounded-full border border-border/80 hover:bg-accent transition-colors"
          >
            {isLoading ? "Đang tải..." : "Xem thêm sản phẩm"}
          </Button>
        </div>
      )}
    </div>
  );
}
