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
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ProductFilters } from "./ProductFilters";

interface ProductFilterMobileProps {
  categories?: { id: string; name: string; slug: string }[];
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

  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Check category
    const category = searchParams.get("category");
    if (category && category !== "all") count++;

    // Check brands
    const brands =
      searchParams.getAll("brands") || searchParams.getAll("brandIds");
    if (brands.length > 0) count++;

    // Check price
    if (searchParams.get("minPrice") || searchParams.get("maxPrice")) count++;

    // Check specs
    const specKeys = Array.from(searchParams.keys()).filter((k) =>
      k.startsWith("spec_"),
    );
    count += specKeys.length;

    return count;
  }, [searchParams]);

  return (
    <div className="lg:hidden shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative gap-2">
            <Filter data-icon="inline-start" />
            <span className="hidden sm:inline">Lọc sản phẩm</span>
            <span className="sm:hidden">Lọc</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="rounded-sm">
                Chọn {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          // className="w-[300px] sm:w-[400px] p-0"
          showCloseButton={false}
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
