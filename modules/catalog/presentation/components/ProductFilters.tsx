"use client";

import { ProductPriceFilter } from "@/shared/components/layout/user/product-price-filter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { Search } from "lucide-react";
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
    updateFilters({ category: checked ? slug : null });
  };

  const handleBrandChange = (brandId: string, checked: boolean) => {
    const newBrands = checked
      ? [...currentBrands, brandId]
      : currentBrands.filter((id) => id !== brandId);
    updateFilters({ brandIds: newBrands });
  };

  const handleSpecChange = (label: string, value: string, checked: boolean) => {
    const key = `spec_${label}`;
    const values = currentSpecs[label] || [];
    const newValues = checked
      ? [...values, value]
      : values.filter((v) => v !== value);

    updateFilters({ [key]: newValues.length > 0 ? newValues : null });
  };

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
    Object.keys(currentSpecs).forEach((label) => params.delete(`spec_${label}`));
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Bộ lọc</h3>
        {hasAnyFilter && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Xóa tất cả
          </Button>
        )}
      </div>
      <Separator />

      <Accordion
        type="multiple"
        defaultValue={["category", "Kiểu lắp đặt"]}
        className="w-full"
      >
        {/* Unified Category Filter */}
        {categories.length > 0 && (
          <FilterGroup
            label="Danh mục"
            items={categories.map((c) => ({ id: c.slug, name: c.name }))}
            selectedValues={[currentCategory]}
            onToggle={handleCategoryChange}
          />
        )}

        {/* Unified Brand Filter */}
        {availableFilters.brands.length > 0 && (
          <FilterGroup
            label="Thương hiệu"
            items={availableFilters.brands}
            selectedValues={currentBrands}
            onToggle={handleBrandChange}
          />
        )}

        {/* Unified Specs Filters */}
        {availableFilters.specs.map((spec) => (
          <FilterGroup
            key={spec.label}
            label={spec.label}
            items={spec.values.map((v) => ({ id: v, name: v }))}
            selectedValues={currentSpecs[spec.label] || []}
            onToggle={(id, checked) =>
              handleSpecChange(spec.label, id, checked)
            }
            showSearch={spec.values.length > 8}
          />
        ))}

        {/* Price Filter */}
        <AccordionFilterWrapper label="Khoảng giá" hasSelection={false}>
          <ProductPriceFilter
            hideLabel
            minPriceLimit={availableFilters.minPrice}
            maxPriceLimit={availableFilters.maxPrice}
          />
        </AccordionFilterWrapper>
      </Accordion>
    </div>
  );
}

interface AccordionFilterWrapperProps {
  label: string;
  hasSelection: boolean;
  children: React.ReactNode;
}

function AccordionFilterWrapper({
  label,
  children,
}: {
  label: string;
  hasSelection: boolean;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={label}>
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>{label}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

function FilterGroup({
  label,
  items,
  selectedValues,
  onToggle,
  showSearch = false,
}: {
  label: string;
  items: { id: string; name: string }[];
  selectedValues: string[];
  onToggle: (id: string, checked: boolean) => void;
  showSearch?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search]);

  const hasSelection =
    selectedValues.length > 0 && !selectedValues.includes("all");

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
                <span className="text-sm font-medium leading-none group-hover:text-foreground transition-colors">
                  {item.name}
                </span>
              </label>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <p>
            Không tìm thấy kết quả
          </p>
        )}
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
