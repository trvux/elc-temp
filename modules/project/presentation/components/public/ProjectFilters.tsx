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

interface ProjectFiltersProps {
  serviceTypes: ServiceTypeItem[];
  currentServiceTypeSlug?: string;
  categories: CategoryItem[];
  currentCategorySlugs?: string[];
  onFilterChange?: () => void;
}

export function ProjectFilters({
  serviceTypes,
  currentServiceTypeSlug = "",
  categories,
  currentCategorySlugs = [],
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

  const hasAnyFilter = !!(currentServiceTypeSlug || currentCategorySlugs.length > 0);

  const handleServiceTypeSelect = (slug: string | null) => {
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

  const clearAllFilters = () => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");
    sParams.delete("category");
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

  const activeAccordionValues = ["Không gian kiến trúc", "Thiết bị lắp đặt"];

  return (
    <div className="flex flex-col gap-2">
      {isPending && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-muted z-[9999] overflow-hidden">
          <div className="h-full bg-linear-to-r from-primary via-primary/80 to-primary animate-loading-bar" />
        </div>
      )}

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
        {serviceTypes.length > 0 && (
          <AccordionItem value="Không gian kiến trúc">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>Không gian kiến trúc</span>
                {currentServiceTypeSlug && (
                  <Badge variant="secondary" className="rounded-sm">
                    <Check data-icon="inline-start" className="w-3 h-3" /> 1 được chọn
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 h-auto!">
              <div className="flex flex-col gap-1 -mx-6">
                {/* Specific Options */}
                {serviceTypes.map((st) => {
                  if (st.count !== undefined && st.count <= 0) return null;
                  const isActive = currentServiceTypeSlug === st.slug;
                  return (
                    <label
                      key={st.id}
                      className={cn(
                        "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group pl-6 hover:bg-muted/50 cursor-pointer"
                      )}
                    >
                      <Checkbox
                        id={`filter-serviceType-${st.slug}`}
                        checked={isActive}
                        disabled={isPending}
                        onCheckedChange={(checked) => {
                          handleServiceTypeSelect(checked ? st.slug : null);
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
        {currentServiceTypeSlug && categories.length > 0 && (
          <AccordionItem value="Thiết bị lắp đặt">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>Thiết bị lắp đặt</span>
                {currentCategorySlugs.length > 0 && (
                  <Badge variant="secondary" className="rounded-sm">
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
