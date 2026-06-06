"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";
import { Check, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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

interface ProjectFiltersProps {
  projectTypes: ProjectTypeItem[];
  currentProjectTypeSlug?: string;
  categories: CategoryItem[];
  currentCategorySlugs?: string[];
  services: ServiceItem[];
  currentServiceSlugs?: string[];
  onFilterChange?: () => void;
}

export function ProjectFilters({
  projectTypes,
  currentProjectTypeSlug = "",
  categories,
  currentCategorySlugs = [],
  services = [],
  currentServiceSlugs = [],
  onFilterChange,
}: ProjectFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasAnyFilter = !!(
    currentProjectTypeSlug ||
    currentCategorySlugs.length > 0 ||
    currentServiceSlugs.length > 0
  );

  const handleProjectTypeSelect = (slug: string | null) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page"); // Reset pagination on filter change
    sParams.delete("category"); // Reset categories on service type change

    const newPathname = slug ? `/du-an/${slug}` : "/du-an";

    startTransition(() => {
      router.push(`${newPathname}?${sParams.toString()}`, { scroll: false });
      router.refresh();
    });

    if (onFilterChange) onFilterChange();
  };

  const handleCategoryToggle = (slug: string | null) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");

    if (slug === null) {
      sParams.delete("category");
    } else {
      let nextSlugs = [...currentCategorySlugs];
      if (nextSlugs.includes(slug)) {
        nextSlugs = nextSlugs.filter((s) => s !== slug);
      } else {
        nextSlugs.push(slug);
      }

      if (nextSlugs.length > 0) {
        sParams.set("category", nextSlugs.join(","));
      } else {
        sParams.delete("category");
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${sParams.toString()}`, { scroll: false });
      router.refresh();
    });

    if (onFilterChange) onFilterChange();
  };

  const handleServiceToggle = (slug: string | null) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");

    if (slug === null) {
      sParams.delete("service");
    } else {
      let nextSlugs = [...currentServiceSlugs];
      if (nextSlugs.includes(slug)) {
        nextSlugs = nextSlugs.filter((s) => s !== slug);
      } else {
        nextSlugs.push(slug);
      }

      if (nextSlugs.length > 0) {
        sParams.set("service", nextSlugs.join(","));
      } else {
        sParams.delete("service");
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${sParams.toString()}`, { scroll: false });
      router.refresh();
    });

    if (onFilterChange) onFilterChange();
  };

  const clearAllFilters = () => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");
    sParams.delete("category");
    sParams.delete("service");
    sParams.delete("search");

    startTransition(() => {
      router.push("/du-an", { scroll: false });
      router.refresh();
    });

    if (onFilterChange) onFilterChange();
  };

  if (!isMounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded w-1/2" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  const activeAccordionValues = ["Không gian kiến trúc", "Thiết bị lắp đặt", "Dịch vụ"];

  return (
    <div className="flex flex-col gap-2">


      <div className="flex items-center justify-between h-10">
        <h3 className="font-bold">Bộ lọc dự án</h3>
        {hasAnyFilter && (
          <Button
            variant="secondary"
            size="sm"
            onClick={clearAllFilters}
            disabled={isPending}
            className="hidden lg:inline-flex"
          >
            <X data-icon="inline-start" className="w-3.5 h-3.5" />
            Xóa tất cả
          </Button>
        )}
      </div>
      <Separator />

      <Accordion
        type="multiple"
        defaultValue={activeAccordionValues}
        className="w-full"
      >
        {/* Service Type (Không gian kiến trúc) - Single selection */}
        {projectTypes.length > 0 && (
          <AccordionItem value="Không gian kiến trúc">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>Không gian kiến trúc</span>
                {currentProjectTypeSlug && (
                  <Badge variant="secondary">
                    <Check data-icon="inline-start" className="w-3 h-3" /> 1 được chọn
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 h-auto!">
              <div className="flex flex-col gap-1 -mx-6">
                {/* Specific Options */}
                {projectTypes.map((st) => {
                  if (st.count !== undefined && st.count <= 0) return null;
                  const isActive = currentProjectTypeSlug === st.slug;
                  return (
                    <label
                      key={st.id}
                      className={cn(
                        "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group pl-6 hover:bg-muted/50 cursor-pointer"
                      )}
                    >
                      <Checkbox
                        id={`filter-projectType-${st.slug}`}
                        checked={isActive}
                        disabled={isPending}
                        onCheckedChange={(checked) => {
                          handleProjectTypeSelect(checked ? st.slug : null);
                        }}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium leading-snug group-hover:text-foreground transition-colors",
                          isActive && "text-foreground font-semibold"
                        )}
                      >
                        {st.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Categories (Thiết bị lắp đặt) - Multi selection */}
        {currentProjectTypeSlug && categories.length > 0 && (
          <AccordionItem value="Thiết bị lắp đặt">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>Thiết bị lắp đặt</span>
                {currentCategorySlugs.length > 0 && (
                  <Badge variant="secondary">
                    <Check data-icon="inline-start" className="w-3 h-3" /> {currentCategorySlugs.length} chọn
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 h-auto!">
              <div className="flex flex-col gap-1 -mx-6">
                {/* Specific Options */}
                {categories.map((cat) => {
                  if (cat.count !== undefined && cat.count <= 0) return null;
                  const isActive = currentCategorySlugs.includes(cat.slug);
                  return (
                    <label
                      key={cat.id}
                      className={cn(
                        "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group pl-6 hover:bg-muted/50 cursor-pointer"
                      )}
                    >
                      <Checkbox
                        id={`filter-category-${cat.slug}`}
                        checked={isActive}
                        disabled={isPending}
                        onCheckedChange={() => handleCategoryToggle(cat.slug)}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium leading-snug group-hover:text-foreground transition-colors",
                          isActive && "text-foreground font-semibold"
                        )}
                      >
                        {cat.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Services (Dịch vụ) - Multi selection */}
        {services.length > 0 && (
          <AccordionItem value="Dịch vụ">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>Dịch vụ</span>
                {currentServiceSlugs.length > 0 && (
                  <Badge variant="secondary">
                    <Check data-icon="inline-start" className="w-3 h-3" /> {currentServiceSlugs.length} chọn
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 h-auto!">
              <div className="flex flex-col gap-1 -mx-6">
                {/* Specific Options */}
                {services.map((svc) => {
                  if (svc.count !== undefined && svc.count <= 0) return null;
                  const isActive = currentServiceSlugs.includes(svc.slug);
                  return (
                    <label
                      key={svc.id}
                      className={cn(
                        "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group pl-6 hover:bg-muted/50 cursor-pointer"
                      )}
                    >
                      <Checkbox
                        id={`filter-service-${svc.slug}`}
                        checked={isActive}
                        disabled={isPending}
                        onCheckedChange={() => handleServiceToggle(svc.slug)}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium leading-snug group-hover:text-foreground transition-colors",
                          isActive && "text-foreground font-semibold"
                        )}
                      >
                        {svc.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {hasAnyFilter && (
        <div className="mt-4 pt-4 border-t lg:hidden">
          <Button
            variant="secondary"
            className="w-full justify-center gap-2"
            onClick={clearAllFilters}
            disabled={isPending}
          >
            <X className="size-4" />
            Xóa tất cả
          </Button>
        </div>
      )}
    </div>
  );
}
