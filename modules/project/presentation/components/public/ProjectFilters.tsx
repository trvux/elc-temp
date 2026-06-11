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
import { useFilterTransition } from "@/shared/providers/filter-transition-provider";
import { Check, X } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
  currentCondition?: string;
  onFilterChange?: () => void;
}

export function ProjectFilters({
  projectTypes,
  currentProjectTypeSlug = "",
  categories,
  currentCategorySlugs = [],
  services = [],
  currentServiceSlugs = [],
  currentCondition = "",
  onFilterChange,
}: ProjectFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPending, startTransition } = useFilterTransition();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        setIsMounted(true);
      }
    }, 0);
    return () => {
      active = false;
    };
  }, []);

  // Local states for optimistic UI updates
  const [localProjectTypeSlug, setLocalProjectTypeSlug] = useState<string>("");
  const [localCategorySlugs, setLocalCategorySlugs] = useState<string[]>([]);
  const [localServiceSlugs, setLocalServiceSlugs] = useState<string[]>([]);
  const [localCondition, setLocalCondition] = useState<string>("");

  // Keep local state in sync with props changes
  useEffect(() => {
    if (isPending) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLocalProjectTypeSlug(currentProjectTypeSlug);
    setLocalCategorySlugs(currentCategorySlugs);
    setLocalServiceSlugs(currentServiceSlugs);
    setLocalCondition(currentCondition);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [
    currentProjectTypeSlug,
    currentCategorySlugs,
    currentServiceSlugs,
    currentCondition,
    isPending,
  ]);

  const hasAnyFilter = !!(
    localProjectTypeSlug ||
    localCategorySlugs.length > 0 ||
    localServiceSlugs.length > 0 ||
    localCondition
  );

  const handleProjectTypeSelect = (slug: string | null) => {
    const nextSlug = slug || "";
    setLocalProjectTypeSlug(nextSlug);
    setLocalCategorySlugs([]); // Reset category on type select optimistically
    setLocalServiceSlugs([]); // Reset services on type select optimistically
    setLocalCondition(""); // Reset condition on type select optimistically

    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");
    sParams.delete("category");
    sParams.delete("service");
    sParams.delete("condition");

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
      setLocalCategorySlugs([]);
      sParams.delete("category");
    } else {
      let nextSlugs = [...localCategorySlugs];
      if (nextSlugs.includes(slug)) {
        nextSlugs = nextSlugs.filter((s) => s !== slug);
      } else {
        nextSlugs.push(slug);
      }
      setLocalCategorySlugs(nextSlugs);

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
      setLocalServiceSlugs([]);
      sParams.delete("service");
    } else {
      let nextSlugs = [...localServiceSlugs];
      if (nextSlugs.includes(slug)) {
        nextSlugs = nextSlugs.filter((s) => s !== slug);
      } else {
        nextSlugs.push(slug);
      }
      setLocalServiceSlugs(nextSlugs);

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

  const handleConditionToggle = (conditionValue: string | null) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");

    if (conditionValue === null || localCondition === conditionValue) {
      setLocalCondition("");
      sParams.delete("condition");
    } else {
      setLocalCondition(conditionValue);
      sParams.set("condition", conditionValue);
    }

    startTransition(() => {
      router.push(`${pathname}?${sParams.toString()}`, { scroll: false });
      router.refresh();
    });

    if (onFilterChange) onFilterChange();
  };

  const clearAllFilters = () => {
    setLocalProjectTypeSlug("");
    setLocalCategorySlugs([]);
    setLocalServiceSlugs([]);
    setLocalCondition("");

    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");
    sParams.delete("category");
    sParams.delete("service");
    sParams.delete("search");
    sParams.delete("condition");

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

  const activeAccordionValues = [
    "Dịch vụ",
    "Loại sản phẩm",
    ...(localProjectTypeSlug ? ["Loại công trình"] : []),
    ...(localCondition ? ["Tình trạng sản phẩm"] : []),
  ];

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
        key={activeAccordionValues.join(",")}
        className="w-full"
      >
        {/* Service Type (Loại công trình) - Single selection */}
        {projectTypes.length > 0 && (
          <AccordionItem value="Loại công trình">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>Loại công trình</span>
                {localProjectTypeSlug && (
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Check
                      data-icon="inline-start"
                      className="w-3 h-3"
                      weight="bold"
                    />
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 h-auto!">
              <div className="flex flex-col gap-1 -mx-6">
                {/* Specific Options */}
                {projectTypes.map((st) => {
                  if (st.count !== undefined && st.count <= 0) return null;
                  const isActive = localProjectTypeSlug === st.slug;
                  return (
                    <label
                      key={st.id}
                      className={cn(
                        "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group pl-6 hover:bg-muted/50 cursor-pointer",
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
                          isActive && "text-foreground font-semibold",
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

        {/* Services (Dịch vụ) - Multi selection */}
        {localProjectTypeSlug && services.length > 0 && (
          <AccordionItem value="Dịch vụ">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>Dịch vụ</span>
                {localServiceSlugs.length > 0 && (
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Check
                      data-icon="inline-start"
                      className="w-3 h-3"
                      weight="bold"
                    />
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 h-auto!">
              <div className="flex flex-col gap-1 -mx-6">
                {/* Specific Options */}
                {services.map((svc) => {
                  if (svc.count !== undefined && svc.count <= 0) return null;
                  const isActive = localServiceSlugs.includes(svc.slug);
                  return (
                    <label
                      key={svc.id}
                      className={cn(
                        "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group pl-6 hover:bg-muted/50 cursor-pointer",
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
                          isActive && "text-foreground font-semibold",
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

        {/* Categories (Loại sản phẩm) - Multi selection */}
        {localProjectTypeSlug && categories.length > 0 && (
          <AccordionItem value="Loại sản phẩm">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>Loại sản phẩm</span>
                {localCategorySlugs.length > 0 && (
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Check
                      data-icon="inline-start"
                      className="w-3 h-3"
                      weight="bold"
                    />
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 h-auto!">
              <div className="flex flex-col gap-1 -mx-6">
                {/* Specific Options */}
                {categories.map((cat) => {
                  if (cat.count !== undefined && cat.count <= 0) return null;
                  const isActive = localCategorySlugs.includes(cat.slug);
                  return (
                    <label
                      key={cat.id}
                      className={cn(
                        "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group pl-6 hover:bg-muted/50 cursor-pointer",
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
                          isActive && "text-foreground font-semibold",
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

        {/* Condition (Tình trạng) */}
        <AccordionItem value="Tình trạng sản phẩm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span>Tình trạng sản phẩm</span>
              {localCondition && (
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Check
                    data-icon="inline-start"
                    className="w-3 h-3"
                    weight="bold"
                  />
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-2 h-auto!">
            <div className="flex flex-col gap-1 -mx-6">
              <label
                className={cn(
                  "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group pl-6 hover:bg-muted/50 cursor-pointer",
                )}
              >
                <Checkbox
                  id="filter-condition-new"
                  checked={localCondition === "new"}
                  disabled={isPending}
                  onCheckedChange={(checked) => {
                    handleConditionToggle(checked ? "new" : null);
                  }}
                />
                <span
                  className={cn(
                    "text-sm font-medium leading-snug group-hover:text-foreground transition-colors",
                    localCondition === "new" && "text-foreground font-semibold",
                  )}
                >
                  Mới
                </span>
              </label>
              <label
                className={cn(
                  "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group pl-6 hover:bg-muted/50 cursor-pointer",
                )}
              >
                <Checkbox
                  id="filter-condition-used"
                  checked={localCondition === "used"}
                  disabled={isPending}
                  onCheckedChange={(checked) => {
                    handleConditionToggle(checked ? "used" : null);
                  }}
                />
                <span
                  className={cn(
                    "text-sm font-medium leading-snug group-hover:text-foreground transition-colors",
                    localCondition === "used" &&
                      "text-foreground font-semibold",
                  )}
                >
                  Cũ
                </span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>
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
