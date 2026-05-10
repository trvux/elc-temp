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
import { Filter } from "lucide-react";
import { ProductFilters } from "./ProductFilters";

interface ProductFilterMobileProps {
  categories?: { id: string; name: string; slug: string }[];
  availableFilters: {
    brands: { id: string; name: string }[];
    specs: { label: string; values: string[] }[];
    minPrice: number;
    maxPrice: number;
  };
  totalCount: number;
}

export function ProductFilterMobile({
  categories = [],
  availableFilters,
  totalCount,
}: ProductFilterMobileProps) {
  return (
    <div className="lg:hidden flex justify-between items-center p-3 mb-6 border rounded-lg">
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm font-semibold">Bộ lọc</span>
        <Badge variant="secondary" className="rounded-full px-2 h-5">
          {totalCount}
        </Badge>
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
