"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { Check, Filter } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ProductFilters } from "./ProductFilters";

interface ProductFilterMobileProps {
  categories?: { id: string; name: string; slug: string }[];
  availableFilters: {
    brands: { id: string; name: string }[];
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
    const brands = searchParams.getAll("brandIds");
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
    <div className="lg:hidden flex justify-between items-center p-3 mb-6 border rounded-lg">
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm font-semibold">Bộ lọc</span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="rounded-sm">
            <Check data-icon="inline-start" />
            {activeFilterCount}
            <span>Mục được chọn</span>
          </Badge>
        )}
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter size={14} />
            Lọc sản phẩm
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-75 sm:w-100 p-0">
          <SheetHeader className="p-4 text-left">
            <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
            <SheetDescription>
              Tìm kiếm sản phẩm phù hợp với nhu cầu của bạn.
            </SheetDescription>
          </SheetHeader>
          <Separator />
          <div className="p-4 overflow-y-auto h-[calc(100vh-140px)]">
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
