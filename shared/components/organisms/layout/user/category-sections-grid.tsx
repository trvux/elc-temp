"use client";

import type { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductGrid } from "@/modules/catalog/presentation/components/ProductGrid";
import type { ZoneLookupResult } from "@/modules/shipping-zone";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { TypographyH2, TypographyH3 } from "@/shared/components/ui/typography";
import { ArrowRight, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState } from "react";

export type CategorySectionData = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  groupId: string | null;
  groupName: string | null;
  groupSlug: string | null;
  initialProducts: ProductWithRelations[];
  totalCount: number;
};

function CategorySection({
  categoryId,
  categoryName,
  categorySlug,
  initialProducts,
  totalCount,
  shippingZone,
}: CategorySectionData & { shippingZone?: ZoneLookupResult | null }) {
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
        {/* h3, not h2 — the new group heading in CategorySectionsGrid below
            is the h2 for this section of the page; a category sits one
            level under its group. */}
        <TypographyH3 className="text-lg md:text-xl font-bold">
          {categoryName}
        </TypographyH3>
        <Link
          href={`/san-pham/${categorySlug}`}
          prefetch={false}
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Xem tất cả {totalCount} sản phẩm
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <ProductGrid products={products} shippingZone={shippingZone} />

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
  shippingZone,
}: {
  sections: CategorySectionData[];
  // Fetched once by the page (a real Server Component) and passed down —
  // this whole tree is "use client" (client-side "load more" pagination
  // state), so a ProductGrid rendered from in here can't fetch its own
  // Server Action data without tripping Next's "Server Functions cannot be
  // called during initial render" guard.
  shippingZone?: ZoneLookupResult | null;
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
      {sections.map((section, i) => {
        // Sections are already sorted group-then-category (see
        // getCachedCategorySections' catOrder), so a group heading right
        // before that group's first section is enough to divide the whole
        // list — no need to group them into a nested structure. Without
        // this, the hub page never linked to the group pages themselves
        // (/san-pham/may-lanh etc.) anywhere in its main content, only from
        // the site-wide footer nav — found 2026-09-27 while auditing it as
        // the parent of those group pages.
        const isNewGroup = section.groupId !== sections[i - 1]?.groupId;

        return (
          <div key={section.categoryId} className="flex flex-col gap-6">
            {isNewGroup && section.groupName && section.groupSlug && (
              <TypographyH2 className="font-bold">
                <Link
                  href={`/san-pham/${section.groupSlug}`}
                  prefetch={false}
                  className="group inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  {section.groupName}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </TypographyH2>
            )}
            <CategorySection {...section} shippingZone={shippingZone} />
            {i < sections.length - 1 && <Separator />}
          </div>
        );
      })}
    </div>
  );
}
