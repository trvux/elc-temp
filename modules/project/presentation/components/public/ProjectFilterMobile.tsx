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
import { ProjectFilters } from "./ProjectFilters";

interface ServiceTypeItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface ProjectFilterMobileProps {
  serviceTypes: ServiceTypeItem[];
  currentServiceTypeSlug?: string;
  categories: CategoryItem[];
  currentCategorySlugs?: string[];
}

export function ProjectFilterMobile({
  serviceTypes,
  currentServiceTypeSlug = "",
  categories,
  currentCategorySlugs = [],
}: ProjectFilterMobileProps) {
  const searchParams = useSearchParams();
  const params = useParams();
  const slugFromPath = params.slug as string;

  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Check if serviceType is selected (either in flat URL slug or otherwise)
    if (slugFromPath && serviceTypes.some((st) => st.slug === slugFromPath)) {
      count++;
    } else if (currentServiceTypeSlug) {
      count++;
    }

    // Check category slugs in search parameters
    if (currentCategorySlugs.length > 0) {
      count++;
    }

    // Check search queries
    if (searchParams.get("search")) {
      count++;
    }

    return count;
  }, [searchParams, slugFromPath, serviceTypes, currentServiceTypeSlug, currentCategorySlugs]);

  return (
    <div className="lg:hidden shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative gap-2">
            <Filter data-icon="inline-start" />
            <span className="hidden sm:inline">Lọc dự án</span>
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
          className="!z-[300] !w-screen !max-w-none"
          showCloseButton={true}
        >
          <SheetHeader className="hidden p-6">
            <SheetTitle className="sr-only">Bộ lọc dự án</SheetTitle>
            <SheetDescription className="sr-only">
              Bộ lọc dự án công trình theo các không gian và thiết bị lắp đặt được chọn
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-80px)] overflow-y-auto p-6">
            <ProjectFilters
              serviceTypes={serviceTypes}
              currentServiceTypeSlug={currentServiceTypeSlug}
              categories={categories}
              currentCategorySlugs={currentCategorySlugs}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
