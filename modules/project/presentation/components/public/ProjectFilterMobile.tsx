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
import { Funnel } from "@phosphor-icons/react";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ProjectFilters } from "./ProjectFilters";

interface ProjectTypeItem {
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

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface ProjectFilterMobileProps {
  projectTypes: ProjectTypeItem[];
  currentProjectTypeSlug?: string;
  categories: CategoryItem[];
  currentCategorySlugs?: string[];
  services: ServiceItem[];
  currentServiceSlugs?: string[];
}

export function ProjectFilterMobile({
  projectTypes,
  currentProjectTypeSlug = "",
  categories,
  currentCategorySlugs = [],
  services = [],
  currentServiceSlugs = [],
}: ProjectFilterMobileProps) {
  const searchParams = useSearchParams();
  const params = useParams();
  const slugFromPath = params.slug as string;

  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Check if projectType is selected (either in flat URL slug or otherwise)
    if (slugFromPath && projectTypes.some((st) => st.slug === slugFromPath)) {
      count++;
    } else if (currentProjectTypeSlug) {
      count++;
    }

    // Check category slugs in search parameters
    if (currentCategorySlugs.length > 0) {
      count++;
    }

    // Check service slugs in search parameters
    if (currentServiceSlugs.length > 0) {
      count++;
    }

    // Check search queries
    if (searchParams.get("search")) {
      count++;
    }

    return count;
  }, [searchParams, slugFromPath, projectTypes, currentProjectTypeSlug, currentCategorySlugs, currentServiceSlugs]);

  return (
    <div className="lg:hidden shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative gap-2">
            <Funnel data-icon="inline-start" />
            <span className="hidden sm:inline">Lọc dự án</span>
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
            <SheetTitle className="sr-only">Bộ lọc dự án</SheetTitle>
            <SheetDescription className="sr-only">
              Bộ lọc dự án công trình theo các không gian và thiết bị lắp đặt được chọn
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-80px)] overflow-y-auto p-6">
            <ProjectFilters
              projectTypes={projectTypes}
              currentProjectTypeSlug={currentProjectTypeSlug}
              categories={categories}
              currentCategorySlugs={currentCategorySlugs}
              services={services}
              currentServiceSlugs={currentServiceSlugs}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
