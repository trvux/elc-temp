"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { Filter } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ProductFilters, type ProductFilterCategory } from "./ProductFilters";

interface ProductFilterMobileProps {
  categories?: ProductFilterCategory[];
  availableFilters: {
    brands: { id: string; name: string; slug: string }[];
    specs: { label: string; values: string[] }[];
    minPrice: number;
    maxPrice: number;
  };
}

export function ProductFilterMobile({
  categories = [],
  availableFilters,
}: ProductFilterMobileProps) {
  const searchParams = useSearchParams();
  const params = useParams();
  const slugFromPath = params.slug as string;

  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Check category from flat path slug
    const hasCategoryInPath = slugFromPath && categories.some((c) => c.slug === slugFromPath);
    if (hasCategoryInPath) count++;

    // Check brands
    const brands = searchParams.getAll("brands");
    if (brands.length > 0) count++;

    // Check price
    if (searchParams.get("minPrice") || searchParams.get("maxPrice")) count++;

    // Check specs
    const specKeys = Array.from(searchParams.keys()).filter((k) =>
      k.startsWith("spec_"),
    );
    count += specKeys.length;

    return count;
  }, [searchParams, slugFromPath, categories]);

  return (
    <div className="lg:hidden shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative gap-2">
            <Filter data-icon="inline-start" />
            <span className="hidden sm:inline">Lọc sản phẩm</span>
            <span className="sm:hidden">Lọc</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">
                Chọn {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="!z-[300] !w-full !max-w-none sm:!max-w-[400px]"
          showCloseButton={true}
        >
          <SheetHeader className="hidden p-6">
            <SheetTitle className="sr-only">Bộ lọc sản phẩm</SheetTitle>
            <SheetDescription className="sr-only">
              Bộ lọc sản phẩm theo danh mục các mục được chọn
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-80px)] overflow-y-auto p-6">
            <ProductFilters
              categories={categories}
              availableFilters={availableFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
