"use client";

import { getCategoryDisplayName } from "@/modules/category/application/getCategoryDisplayName";
import { ProductPriceFilter } from "@/shared/components/layout/user/product-price-filter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";
import { Check, Search, X } from "lucide-react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

interface ProductFiltersProps {
  categories?: {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
  }[];
  availableFilters: {
    brands: { id: string; name: string; slug: string }[];
    specs: { label: string; values: string[] }[];
    minPrice: number;
    maxPrice: number;
  };
  isMobile?: boolean;
  onFilterChange?: () => void;
}

export function ProductFilters({
  categories = [],
  availableFilters,
  onFilterChange,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Current entity slug from Flat URL path (/san-pham/[slug])
  const slugFromPath = params.slug as string;

  // Determine if current path belongs to a category (for sidebar highlight)
  const currentCategory = useMemo(() => {
    return categories.find((c) => c.slug === slugFromPath)
      ? slugFromPath
      : "all";
  }, [categories, slugFromPath]);

  // Read selected brands and specs from query parameters
  const currentBrands = useMemo(() => {
    return searchParams.getAll("brands");
  }, [searchParams]);

  const currentSpecs = useMemo(() => {
    const specs: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("spec_")) {
        const label = key.replace("spec_", "");
        if (!specs[label]) specs[label] = [];
        specs[label].push(value);
      }
    });
    return specs;
  }, [searchParams]);

  const hasPriceFilter = useMemo(() => {
    return !!(searchParams.get("minPrice") || searchParams.get("maxPrice"));
  }, [searchParams]);

  const hasAnyFilter = useMemo(() => {
    return (
      currentBrands.length > 0 ||
      (currentCategory !== "all" && currentCategory !== "") ||
      Object.keys(currentSpecs).length > 0 ||
      hasPriceFilter
    );
  }, [currentBrands, currentCategory, currentSpecs, hasPriceFilter]);

  // Group categories by parent group
  const groups = useMemo(() => {
    const activeCategories = categories.filter(
      (c) => !c.name.toLowerCase().includes("chưa phân loại"),
    );
    const roots = activeCategories
      .filter((c) => !c.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    return roots.map((root) => {
      const children = activeCategories
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({
          ...c,
          displayName: getCategoryDisplayName(c),
        }));

      return {
        id: root.id,
        slug: root.slug,
        displayName: getCategoryDisplayName(root),
        children,
      };
    });
  }, [categories]);

  // Helper function to push filter updates to query parameters
  const updateFilters = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const sParams = new URLSearchParams(searchParams.toString());
      sParams.delete("page");

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          sParams.delete(key);
        } else if (Array.isArray(value)) {
          sParams.delete(key);
          value.forEach((v) => sParams.append(key, v));
        } else {
          sParams.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${sParams.toString()}`, { scroll: false });
        router.refresh();
      });
    },
    [router, searchParams, pathname],
  );

  const handleCategoryChange = (slug: string, checked: boolean) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");

    // Find parent group of new and currently active categories
    const newCategoryObj = categories.find((c) => c.slug === slug);
    const activeCategoryObj = categories.find((c) => c.slug === slugFromPath);

    const newParentGroupId = newCategoryObj?.parentId;
    const activeParentGroupId = activeCategoryObj?.parentId;

    // If changing to a category in a different parent group, clear ALL spec/brand query filters
    if (newParentGroupId !== activeParentGroupId) {
      sParams.delete("brands");
      sParams.delete("minPrice");
      sParams.delete("maxPrice");
      Array.from(sParams.keys()).forEach((key) => {
        if (key.startsWith("spec_")) {
          sParams.delete(key);
        }
      });
    }

    // Check if the current page is actually a Brand page (slug from path is a brand slug)
    const isCurrentPageABrand =
      slugFromPath && !categories.some((c) => c.slug === slugFromPath);

    startTransition(() => {
      if (checked) {
        if (isCurrentPageABrand) {
          // Safe-transition: convert brand path parameter to query parameter
          sParams.delete("brands");
          sParams.append("brands", slugFromPath);
        }
        const queryString = sParams.toString();
        const suffix = queryString ? `?${queryString}` : "";
        router.push(`/san-pham/${slug}${suffix}`);
      } else {
        const queryString = sParams.toString();
        const suffix = queryString ? `?${queryString}` : "";
        router.push(`/san-pham${suffix}`);
      }
      router.refresh();
    });
    if (onFilterChange) onFilterChange();
  };

  const handleBrandChange = (brandSlug: string, checked: boolean) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");

    const existing = sParams.getAll("brands").filter((b) => b !== brandSlug);
    sParams.delete("brands");

    if (checked) {
      [...existing, brandSlug].forEach((b) => sParams.append("brands", b));
    } else {
      existing.forEach((b) => sParams.append("brands", b));
    }

    const queryString = sParams.toString();
    const suffix = queryString ? `?${queryString}` : "";
    startTransition(() => {
      router.push(`${window.location.pathname}${suffix}`, { scroll: false });
      router.refresh();
    });
    if (onFilterChange) onFilterChange();
  };

  const handleSpecChange = (label: string, value: string, checked: boolean) => {
    const key = `spec_${label}`;
    updateFilters({ [key]: checked ? value : null });
    if (onFilterChange) onFilterChange();
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push("/san-pham");
      router.refresh();
    });
    if (onFilterChange) onFilterChange();
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeAccordionValues = useMemo(() => {
    const values: string[] = [];
    if (currentBrands.length > 0) values.push("Thương hiệu");
    if (hasPriceFilter) values.push("Khoảng giá");
    Object.keys(currentSpecs).forEach((label) => {
      if (currentSpecs[label].length > 0) values.push(label);
    });

    return values;
  }, [currentBrands, hasPriceFilter, currentSpecs]);

  if (!isMounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded w-1/2" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Premium Loading Progress Bar during transitions */}
      {isPending && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-muted z-[9999] overflow-hidden">
          <div className="h-full bg-linear-to-r from-primary via-primary/80 to-primary animate-loading-bar" />
        </div>
      )}
      <div className="flex items-center justify-between h-10">
        <h3 className="font-bold">Bộ lọc</h3>
        {hasAnyFilter && (
          <Button
            variant="secondary"
            size="sm"
            onClick={clearAllFilters}
            disabled={isPending}
            className="hidden lg:inline-flex"
          >
            <X data-icon="inline-start" />
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
        {/* Category Group Accordions */}
        {groups.map((g) => {
          if (g.children.length === 0) return null;
          const hasSelectedChild = g.children.some(
            (c) => c.slug === currentCategory,
          );
          return (
            <FilterGroup
              key={g.id}
              label={g.displayName}
              items={g.children.map((c) => ({
                id: c.slug,
                name: c.displayName,
              }))}
              selectedValues={[currentCategory]}
              selectionCount={hasSelectedChild ? 1 : 0}
              onToggle={handleCategoryChange}
              disabled={isPending}
            />
          );
        })}

        {/* Brands Filter List */}
        {availableFilters.brands.length > 0 && (
          <FilterGroup
            label="Thương hiệu"
            items={availableFilters.brands.map((b) => ({
              id: b.slug,
              name: b.name,
            }))}
            selectedValues={currentBrands}
            selectionCount={currentBrands.length}
            onToggle={handleBrandChange}
            disabled={isPending}
          />
        )}

        {/* Specs Filters */}
        {availableFilters.specs.map((spec) => (
          <FilterGroup
            key={spec.label}
            label={spec.label}
            items={spec.values.map((v) => ({ id: v, name: v }))}
            selectedValues={currentSpecs[spec.label] || []}
            selectionCount={(currentSpecs[spec.label] || []).length}
            onToggle={(id, checked) =>
              handleSpecChange(spec.label, id, checked)
            }
            showSearch={spec.label !== "Công suất" && spec.values.length > 8}
            disabled={isPending}
          />
        ))}

        {/* Price Range Slider */}
        <AccordionFilterWrapper
          label="Khoảng giá"
          selectionCount={hasPriceFilter ? 1 : 0}
        >
          <ProductPriceFilter
            hideLabel
            minPriceLimit={availableFilters.minPrice}
            maxPriceLimit={availableFilters.maxPrice}
          />
        </AccordionFilterWrapper>
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

function AccordionFilterWrapper({
  label,
  selectionCount = 0,
  children,
}: {
  label: string;
  selectionCount?: number;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={label}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <span className="group-hover/accordion-trigger:underline">
            {label}
          </span>
          {selectionCount > 0 && (
            <Badge variant="secondary" className="rounded-sm">
              <Check data-icon="inline-start" /> Được chọn
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-2 h-auto!">{children}</AccordionContent>
    </AccordionItem>
  );
}

function FilterGroup({
  label,
  items,
  selectedValues,
  selectionCount = 0,
  onToggle,
  showSearch = false,
  disabled = false,
}: {
  label: string;
  items: {
    id: string;
    name: string;
    className?: string;
    rowClassName?: string;
    hideCheckbox?: boolean;
  }[];
  selectedValues: string[];
  selectionCount?: number;
  onToggle: (id: string, checked: boolean) => void;
  showSearch?: boolean;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search]);

  return (
    <AccordionFilterWrapper label={label} selectionCount={selectionCount}>
      <div className="flex flex-col gap-5">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <Input
              placeholder="Tìm nhanh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9"
              disabled={disabled}
            />
          </div>
        )}

        <div className="flex flex-col gap-1 -mx-6">
          {filteredItems.map((item) => {
            const isSelected = selectedValues.includes(item.id);
            const id = `filter-${label}-${item.id}`;
            return (
              <label
                key={item.id}
                className={cn(
                  "flex items-center gap-2 pr-4 py-2 rounded-md transition-colors group",
                  !item.hideCheckbox && "hover:bg-muted/50 cursor-pointer",
                  item.rowClassName || "pl-6",
                )}
              >
                {!item.hideCheckbox && (
                  <ImmediateCheckbox
                    id={id}
                    checked={isSelected}
                    disabled={disabled}
                    onCheckedChange={(checked) => onToggle(item.id, checked)}
                  />
                )}
                <span
                  className={cn(
                    "text-sm font-medium leading-snug group-hover:text-foreground transition-colors",
                    item.className,
                  )}
                >
                  {item.name}
                </span>
              </label>
            );
          })}
        </div>

        {filteredItems.length === 0 && <p>Không tìm thấy kết quả</p>}
      </div>
    </AccordionFilterWrapper>
  );
}

function ImmediateCheckbox({
  id,
  checked,
  disabled = false,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const [internalChecked, setInternalChecked] = useState(checked);

  useEffect(() => {
    setInternalChecked(checked);
  }, [checked]);

  return (
    <Checkbox
      id={id}
      checked={internalChecked}
      disabled={disabled}
      onCheckedChange={(v) => {
        const newValue = !!v;
        setInternalChecked(newValue);
        onCheckedChange(newValue);
      }}
    />
  );
}
