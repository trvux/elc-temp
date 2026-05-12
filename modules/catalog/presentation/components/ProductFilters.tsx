"use client";

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
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductSortBy } from "../../domain/types";

interface ProductFiltersProps {
  categories?: { id: string; name: string; slug: string }[];
  availableFilters: {
    brands: { id: string; name: string }[];
    specs: { label: string; values: string[] }[];
    minPrice: number;
    maxPrice: number;
  };
}

export function ProductFilters({
  categories = [],
  availableFilters,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort =
    (searchParams.get("sortBy") as ProductSortBy) || "price_asc";
  const currentBrands = useMemo(
    () => searchParams.getAll("brandIds"),
    [searchParams],
  );
  const currentCategory = searchParams.get("category") || "all";

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
      // Reset all other filters when switching to a different category
      const updates: Record<string, string | string[] | null> = {
        category: slug,
        brandIds: null,
        minPrice: null,
        maxPrice: null,
      };

      // Also clear all specification-based filters
      searchParams.forEach((_, key) => {
        if (key.startsWith("spec_")) {
          updates[key] = null;
        }
      });

      updateFilters(updates);
    } else {
      updateFilters({ category: null });
    }
  };

  const handleBrandChange = (brandId: string, checked: boolean) => {
    updateFilters({ brandIds: checked ? brandId : null });
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
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brandIds");
    params.delete("sortBy");
    params.delete("category");
    params.delete("minPrice");
    params.delete("maxPrice");
    Object.keys(currentSpecs).forEach((label) =>
      params.delete(`spec_${label}`),
    );
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

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

      <Accordion type="multiple" defaultValue={["Danh mục"]} className="w-full">
        {/* Unified Category Filter */}
        {categories.length > 0 && (
          <FilterGroup
            label="Danh mục"
            items={categories.map((c) => ({ id: c.slug, name: c.name }))}
            selectedValues={[currentCategory]}
            hasSelection={currentCategory !== "all" && currentCategory !== ""}
            onToggle={handleCategoryChange}
          />
        )}

        {/* Unified Brand Filter */}
        {availableFilters.brands.length > 0 && (
          <FilterGroup
            label="Thương hiệu"
            items={availableFilters.brands}
            selectedValues={currentBrands}
            hasSelection={currentBrands.length > 0}
            onToggle={handleBrandChange}
          />
        )}

        {/* Price Filter */}
        <AccordionFilterWrapper
          label="Khoảng giá"
          hasSelection={hasPriceFilter}
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
            hasSelection={(currentSpecs[spec.label] || []).length > 0}
            onToggle={(id, checked) =>
              handleSpecChange(spec.label, id, checked)
            }
            showSearch={spec.values.length > 8}
          />
        ))}
      </Accordion>
    </div>
  );
}

function AccordionFilterWrapper({
  label,
  hasSelection = false,
  children,
}: {
  label: string;
  hasSelection?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={label}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <span className="group-hover/accordion-trigger:underline">
            {label}
          </span>
          {hasSelection && (
            <Badge variant="secondary" className="no-underline rounded-sm">
              <Check data-icon="inline-start" />
              Được chọn
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
  hasSelection = false,
  onToggle,
  showSearch = false,
}: {
  label: string;
  items: { id: string; name: string }[];
  selectedValues: string[];
  hasSelection?: boolean;
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
    <AccordionFilterWrapper label={label} hasSelection={hasSelection}>
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
                className="flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <ImmediateCheckbox
                  id={id}
                  checked={isSelected}
                  onCheckedChange={(checked) => onToggle(item.id, checked)}
                />
                <span className="text-sm font-medium leading-snug group-hover:text-foreground transition-colors">
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
