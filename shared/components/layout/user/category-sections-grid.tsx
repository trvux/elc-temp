"use client";

import type { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ArrowRight, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export type CategorySectionData = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  initialProducts: ProductWithRelations[];
  totalCount: number;
};

function CategorySection({
  categoryId,
  categoryName,
  categorySlug,
  initialProducts,
  totalCount,
}: CategorySectionData) {
  const [products, setProducts] = useState(initialProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadedCountRef = useRef(initialProducts.length);
  const hasMoreRef = useRef(initialProducts.length < totalCount);
  const loadingRef = useRef(false);

  const remaining = totalCount - products.length;
  const hasMore = products.length < totalCount;
  const loadBatch = 12; // Load exactly 12 products per click for perfect grid alignment

  const loadMore = async () => {
    if (loadingRef.current) return;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground font-heading">
          {categoryName}
        </h2>
        <Link
          href={`/san-pham/${categorySlug}`}
          prefetch={false}
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Xem tất cả {totalCount} sản phẩm
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className={GRID_CLASS}>
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < 8} />
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
  );
}

export function CategorySectionsGrid({
  sections,
}: {
  sections: CategorySectionData[];
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
          <CategorySection {...section} />
          {i < sections.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}
