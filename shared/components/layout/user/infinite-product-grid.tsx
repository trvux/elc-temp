"use client";

import type { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useCallback, useEffect, useRef, useState } from "react";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]";

const PREFETCH_ROWS = 5;

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
}: InfiniteProductGridProps) {
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const [isLoading, setIsLoading] = useState(false);

  // Refs so loadMore never becomes stale from state changes
  const hasMoreRef = useRef(initialProducts.length < totalCount);
  const pageSizeRef = useRef(12);
  const loadedCountRef = useRef(initialProducts.length);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const paramsKeyRef = useRef(serializeParams(fetchParams));

  // Measure actual column count to compute dynamic page size
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const update = () => {
      const cols = window.getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      pageSizeRef.current = cols * PREFETCH_ROWS;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

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
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
    // IntersectionObserver only fires on state CHANGE — if sentinel stays in range
    // after a load it won't fire again. Chain next load automatically.
    if (hasMoreRef.current) {
      setTimeout(loadMore, 0);
    }
  }, [fetchParams]);

  // Reset when filters/search change and kick off loading immediately.
  // The mount-time effect below only runs once — route-level navigation with the same
  // layout reuses the component instance, so we must trigger here on param changes too.
  // IO won't re-fire if the sentinel stays intersecting across the param change.
  useEffect(() => {
    const newKey = serializeParams(fetchParams);
    if (newKey !== paramsKeyRef.current) {
      paramsKeyRef.current = newKey;
      setProducts(initialProducts);
      loadedCountRef.current = initialProducts.length;
      loadingRef.current = false; // cancel any in-progress load from previous params
      hasMoreRef.current = initialProducts.length < totalCount;
      setHasMore(initialProducts.length < totalCount);
      if (initialProducts.length < totalCount) {
        setTimeout(loadMore, 0);
      }
    }
  }, [fetchParams, initialProducts, totalCount, loadMore]);

  // Kick off the first load immediately on mount — don't wait for IO
  // (IO only fires on intersection *change*, so if sentinel is already in view on load it may miss)
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver as the ongoing trigger when user scrolls near bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "0px 0px 1600px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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

      {hasMore && <div ref={sentinelRef} className="h-1 w-full" aria-hidden />}
    </div>
  );
}
