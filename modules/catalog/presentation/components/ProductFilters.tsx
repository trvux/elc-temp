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
import { Check, Search, X } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { ProductSortBy } from "../../domain/types";

interface ProductFiltersProps {
  categories?: { id: string; name: string; slug: string; parentId?: string | null }[];
  availableFilters: {
    brands: { id: string; name: string; slug: string }[];
    specs: { label: string; values: string[] }[];
    minPrice: number;
    maxPrice: number;
  };
  isMobile?: boolean;
  onFilterChange?: () => void;
}

const CATEGORY_PRIORITY_ORDER = [
  "may-lanh",
  "may-lanh-treo-tuong",
  "may-loc-khong-khi",
  "may-loc-khong-khi-may-loc-nuoc",
  "may-lanh-dieu-hoa-tu-dung",
  "may-lanh-am-tran",
  "may-lanh-giau-tran-noi-ong-gio",
  "may-lanh-ap-tran",
  "may-loc-khong-khi-may-cap-khi-tuoi-loc-khong-khi",
  "may-loc-khong-khi-phu-kien-dong-bo-cua-he-thong-cap-gio-tuoi",
];

function getCategoryPriority(slug: string): number {
  const index = CATEGORY_PRIORITY_ORDER.indexOf(slug);
  return index === -1 ? 999 : index;
}

export function ProductFilters({
  categories = [],
  availableFilters,
  isMobile,
  onFilterChange,
}: ProductFiltersProps) {
  const sortedCategories = useMemo(() => {
    const activeCategories = categories.filter(
      (c) => !c.name.toLowerCase().includes("chưa phân loại")
    );
    const roots = activeCategories
      .filter((c) => !c.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const result: (typeof categories[0] & { displayName: string; isChild: boolean; hasCheckbox: boolean })[] = [];

    roots.forEach((root) => {
      // Add parent (no checkbox)
      result.push({
        ...root,
        displayName: getCategoryDisplayName(root),
        isChild: false,
        hasCheckbox: false,
      });

      // Add immediate children (with checkbox)
      const children = activeCategories
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({
          ...c,
          displayName: getCategoryDisplayName(c),
          isChild: true,
          hasCheckbox: true,
        }));
      
      result.push(...children);
    });

    return result;
  }, [categories]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort =
    (searchParams.get("sortBy") as ProductSortBy) || "price_asc";
  const currentBrands = useMemo(
    () => searchParams.getAll("brands"),
    [searchParams],
  );
  const params = useParams();
  const categorySlugFromPath = params.categorySlug as string;
  const currentCategory = categorySlugFromPath || "all";

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

  const updateFilters = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      });

      params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleSortChange = (value: string) => updateFilters({ sortBy: value });

  const handleCategoryChange = (slug: string, checked: boolean) => {
    if (checked) {
      // Navigate to the new clean category URL
      router.push(`/san-pham/${slug}`);
    } else {
      // If unchecked, go back to the main products page
      router.push("/san-pham");
    }
  };

  const handleBrandChange = (brandSlug: string, checked: boolean) => {
    updateFilters({ brands: checked ? brandSlug : null });
  };

  const handleSpecChange = (label: string, value: string, checked: boolean) => {
    const key = `spec_${label}`;
    updateFilters({ [key]: checked ? value : null });
  };

  const hasPriceFilter = useMemo(() => {
    return !!(searchParams.get("minPrice") || searchParams.get("maxPrice"));
  }, [searchParams]);

  const hasAnyFilter = useMemo(() => {
    return (
      currentBrands.length > 0 ||
      (currentCategory !== "all" && currentCategory !== "") ||
      Object.keys(currentSpecs).length > 0 ||
      searchParams.get("minPrice") ||
      searchParams.get("maxPrice")
    );
  }, [currentBrands, currentCategory, currentSpecs, searchParams]);

  const clearAllFilters = () => {
    // Navigate to the main products hub to clear both the category path and all search filters
    router.push("/san-pham");
    if (onFilterChange) onFilterChange();
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-muted rounded w-1/2" />
      <div className="h-40 bg-muted rounded" />
    </div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between h-10">
        <h3 className="font-bold">Bộ lọc</h3>
        {hasAnyFilter && (
          <Button variant="secondary" size="sm" onClick={clearAllFilters}>
            <X data-icon="inline-start" />
            Xóa tất cả
          </Button>
        )}
      </div>
      <Separator />

      <Accordion
        type="multiple"
        defaultValue={["Danh mục", "Công suất"]}
        className="w-full"
      >
        {/* Unified Category Filter */}
        {sortedCategories.length > 0 && (
          <FilterGroup
            label="Danh mục"
            items={sortedCategories.map((c) => ({
              id: c.slug,
              name: c.displayName,
              className: !c.isChild ? "font-bold text-foreground py-3" : "text-muted-foreground",
              rowClassName: !c.isChild ? "pl-4" : "pl-10",
              hideCheckbox: !c.hasCheckbox,
            }))}
            selectedValues={[currentCategory]}
            selectionCount={
              currentCategory !== "all" && currentCategory !== "" ? 1 : 0
            }
            onToggle={handleCategoryChange}
          />
        )}

        {/* Unified Brand Filter */}
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
          />
        )}

        {/* Price Filter */}
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

        {/* Unified Specs Filters */}
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
          />
        ))}
      </Accordion>
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
      <AccordionContent className="px-2">{children}</AccordionContent>
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
}: {
  label: string;
  items: { id: string; name: string; className?: string; rowClassName?: string; hideCheckbox?: boolean }[];
  selectedValues: string[];
  selectionCount?: number;
  onToggle: (id: string, checked: boolean) => void;
  showSearch?: boolean;
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
                  item.rowClassName || "pl-6"
                )}
              >
                {!item.hideCheckbox && (
                  <ImmediateCheckbox
                    id={id}
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggle(item.id, checked)}
                  />
                )}
                <span className={cn(
                  "text-sm font-medium leading-snug group-hover:text-foreground transition-colors",
                  item.className
                )}>
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
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const [internalChecked, setInternalChecked] = useState(checked);

  // Sync with props when server/router state changes
  useEffect(() => {
    setInternalChecked(checked);
  }, [checked]);

  return (
    <Checkbox
      id={id}
      checked={internalChecked}
      onCheckedChange={(v) => {
        const newValue = !!v;
        setInternalChecked(newValue);
        onCheckedChange(newValue);
      }}
    />
  );
}
