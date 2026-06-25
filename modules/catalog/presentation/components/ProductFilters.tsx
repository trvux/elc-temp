"use client";

import { ProductPriceFilter } from "@/shared/components/layout/user/product-price-filter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/shared/components/ui/sidebar";
import { useFilterTransition } from "@/shared/providers/filter-transition-provider";
import { CaretRight, MagnifyingGlass, X } from "@phosphor-icons/react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface ProductFilterCategory {
  id: string;
  name: string;
  slug: string;
  groupId?: string | null;
  orderIndex?: number;
  group?: { id: string; name: string; slug: string; orderIndex?: number } | null;
}

interface ProductFiltersProps {
  categories?: ProductFilterCategory[];
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
  const { isPending, startTransition } = useFilterTransition();

  const slugFromPath = params.slug as string;

  const knownSlugs = useMemo(() => {
    const slugs = new Set<string>();
    categories.forEach((c) => {
      slugs.add(c.slug);
      if (c.group?.slug) slugs.add(c.group.slug);
    });
    return slugs;
  }, [categories]);

  const [localCategory, setLocalCategory] = useState<string>("all");
  const [localBrands, setLocalBrands] = useState<string[]>([]);
  const [localSpecs, setLocalSpecs] = useState<Record<string, string[]>>({});
  const [localCondition, setLocalCondition] = useState<string>("");
  const [openItems, setOpenItems] = useState<string[]>([]);

  useEffect(() => {
    if (isPending) return;
    setLocalCategory(knownSlugs.has(slugFromPath) ? slugFromPath : "all");

    const isBrandFromPath = slugFromPath && (availableFilters?.brands || []).some((b) => b.slug === slugFromPath);
    const queryBrands = searchParams.getAll("brands");
    const brandsToSet = isBrandFromPath
      ? Array.from(new Set([...queryBrands, slugFromPath]))
      : queryBrands;
    setLocalBrands(brandsToSet);

    setLocalCondition(searchParams.get("condition") || "");

    const specs: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("spec_")) {
        const label = key.replace("spec_", "");
        if (!specs[label]) specs[label] = [];
        specs[label].push(value);
      }
    });
    setLocalSpecs(specs);

    const activeValues: string[] = [];
    if (brandsToSet.length > 0) activeValues.push("Thương hiệu");
    if (searchParams.get("minPrice") || searchParams.get("maxPrice")) activeValues.push("Khoảng giá");
    if (searchParams.get("condition")) activeValues.push("Tình trạng sản phẩm");
    Object.keys(specs).forEach((label) => {
      if ((specs[label] || []).length > 0) activeValues.push(label);
    });

    const activeCat = knownSlugs.has(slugFromPath) ? slugFromPath : "all";
    categories.forEach((c) => {
      if (c.slug === activeCat && c.group?.name) {
        activeValues.push(c.group.name);
      }
    });

    setOpenItems(activeValues);
  }, [searchParams, slugFromPath, knownSlugs, isPending, categories, availableFilters]);

  const hasPriceFilter = useMemo(() => {
    return !!(searchParams.get("minPrice") || searchParams.get("maxPrice"));
  }, [searchParams]);

  const hasAnyFilter = useMemo(() => {
    return (
      localBrands.length > 0 ||
      (localCategory !== "all" && localCategory !== "") ||
      Object.keys(localSpecs).some((label) => (localSpecs[label] || []).length > 0) ||
      localCondition !== "" ||
      hasPriceFilter
    );
  }, [localBrands, localCategory, localSpecs, localCondition, hasPriceFilter]);

  const groups = useMemo(() => {
    const activeCategories = categories.filter(
      (c) => !c.name.toLowerCase().includes("chưa phân loại"),
    );

    const byGroup = new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        orderIndex: number;
        children: ProductFilterCategory[];
      }
    >();

    for (const c of activeCategories) {
      if (!c.group) continue;
      if (!byGroup.has(c.group.id)) {
        byGroup.set(c.group.id, {
          id: c.group.id,
          name: c.group.name,
          slug: c.group.slug,
          orderIndex: c.group.orderIndex ?? 0,
          children: [],
        });
      }
      byGroup.get(c.group.id)!.children.push(c);
    }

    return Array.from(byGroup.values())
      .map((g) => ({
        ...g,
        children: g.children.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
      }))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [categories]);

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
    [router, searchParams, pathname, startTransition],
  );

  const handleCategoryChange = (slug: string, checked: boolean) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");
    sParams.delete("brands");
    sParams.delete("minPrice");
    sParams.delete("maxPrice");
    sParams.delete("condition");
    // Clicking a category is navigation — clear the search query so the user
    // browses the full category rather than seeing a search-filtered subset.
    sParams.delete("search");
    sParams.delete("q");
    Array.from(sParams.keys()).forEach((key) => {
      if (key.startsWith("spec_")) sParams.delete(key);
    });

    setLocalBrands([]);
    setLocalSpecs({});
    setLocalCondition("");

    const isCurrentPageABrand = slugFromPath && !knownSlugs.has(slugFromPath);
    const nextCategory = checked ? slug : "all";
    setLocalCategory(nextCategory);

    startTransition(() => {
      if (checked) {
        if (isCurrentPageABrand) {
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

    const localExisting = localBrands.filter((b) => b !== brandSlug);
    const newLocalBrands = checked ? [...localExisting, brandSlug] : localExisting;
    setLocalBrands(newLocalBrands);

    let targetPath = pathname;
    const isGenericProductPage = pathname === "/san-pham";
    const isCurrentPageABrand = slugFromPath && !knownSlugs.has(slugFromPath);

    if (isGenericProductPage && newLocalBrands.length === 1) {
      targetPath = `/san-pham/${newLocalBrands[0]}`;
      sParams.delete("brands");
    } else if (isCurrentPageABrand && newLocalBrands.length === 0) {
      targetPath = "/san-pham";
      sParams.delete("brands");
    } else if (isCurrentPageABrand && newLocalBrands.length > 1) {
      targetPath = "/san-pham";
    } else if (isCurrentPageABrand && newLocalBrands.length === 1 && newLocalBrands[0] !== slugFromPath) {
      targetPath = `/san-pham/${newLocalBrands[0]}`;
      sParams.delete("brands");
    }

    const queryString = sParams.toString();
    const suffix = queryString ? `?${queryString}` : "";
    startTransition(() => {
      router.push(`${targetPath}${suffix}`, { scroll: false });
      router.refresh();
    });
    if (onFilterChange) onFilterChange();
  };

  const handleSpecChange = (label: string, value: string, checked: boolean) => {
    setLocalSpecs((prev) => {
      const current = prev[label] || [];
      const updated = checked
        ? [...current.filter((v) => v !== value), value]
        : current.filter((v) => v !== value);
      return { ...prev, [label]: updated };
    });

    const key = `spec_${label}`;
    updateFilters({ [key]: checked ? value : null });
    if (onFilterChange) onFilterChange();
  };

  const handleConditionChange = (conditionValue: string, checked: boolean) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");
    sParams.delete("condition");
    if (checked) sParams.set("condition", conditionValue);

    setLocalCondition(checked ? conditionValue : "");

    const queryString = sParams.toString();
    const suffix = queryString ? `?${queryString}` : "";
    startTransition(() => {
      router.push(`${window.location.pathname}${suffix}`, { scroll: false });
      router.refresh();
    });
    if (onFilterChange) onFilterChange();
  };

  const activeSearch =
    searchParams.get("search") ?? searchParams.get("q") ?? "";

  // Clears only the search query, keeps filters and current category context
  const clearSearch = () => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("search");
    sParams.delete("q");
    const qs = sParams.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      router.refresh();
    });
    if (onFilterChange) onFilterChange();
  };

  // Clears all filters (brand/spec/price/condition) but keeps search + category
  const clearAllFilters = () => {
    setLocalBrands([]);
    setLocalSpecs({});
    setLocalCondition("");

    const sParams = new URLSearchParams();
    if (activeSearch) sParams.set("search", activeSearch);
    const qs = sParams.toString();

    // Stay on category page if we're in one; otherwise go back to /san-pham
    const isOnCategoryPage = slugFromPath && knownSlugs.has(slugFromPath);
    const targetPath = isOnCategoryPage ? pathname : "/san-pham";
    if (!isOnCategoryPage) setLocalCategory("all");

    startTransition(() => {
      router.push(`${targetPath}${qs ? `?${qs}` : ""}`);
      router.refresh();
    });
    if (onFilterChange) onFilterChange();
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded w-1/2" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <SidebarGroup className="py-0">
        <div className="flex items-center justify-between px-2 h-10">
          <SidebarGroupLabel className="p-0">Bộ lọc sản phẩm</SidebarGroupLabel>
          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              disabled={isPending}
              className="h-7 text-xs text-muted-foreground hover:text-foreground font-medium px-2 gap-1"
            >
              <X className="size-3" />
              Xóa lọc
            </Button>
          )}
        </div>

        {/* Active search chip — shows the current search query with a dismiss button */}
        {activeSearch && (
          <div className="px-2 pb-2">
            <button
              onClick={clearSearch}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-sidebar-primary text-sidebar-primary-foreground rounded-full pl-2.5 pr-2 py-1 text-xs max-w-full hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <MagnifyingGlass className="size-3 shrink-0" />
              <span className="truncate max-w-[140px]">{activeSearch}</span>
              <X className="size-3 shrink-0 ml-0.5" />
            </button>
          </div>
        )}
      </SidebarGroup>

      <SidebarGroup className="py-0">
        <SidebarMenu>
          {/* Category Group Accordions */}
          {groups.map((g) => {
            if (g.children.length === 0) return null;
            const hasSelectedChild = g.children.some((c) => c.slug === localCategory);
            return (
              <FilterSection
                key={g.id}
                label={g.name}
                selectionCount={hasSelectedChild ? 1 : 0}
                openItems={openItems}
                setOpenItems={setOpenItems}
              >
                <SidebarMenuSub>
                  {g.children.map((c) => {
                    const isSelected = c.slug === localCategory;
                    return (
                      <SidebarMenuSubItem key={c.id}>
                        <SidebarMenuSubButton
                          isActive={isSelected}
                          aria-disabled={isPending}
                          onClick={() => handleCategoryChange(c.slug, !isSelected)}
                          className="cursor-pointer data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                        >
                          <span className="leading-snug">{c.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </FilterSection>
            );
          })}

          {/* Brands Filter */}
          {availableFilters.brands.length > 0 && (
            <FilterGroup
              label="Thương hiệu"
              items={availableFilters.brands.map((b) => ({ id: b.slug, name: b.name }))}
              selectedValues={localBrands}
              selectionCount={localBrands.length}
              onToggle={handleBrandChange}
              disabled={isPending}
              openItems={openItems}
              setOpenItems={setOpenItems}
            />
          )}

          {/* Specs Filters */}
          {availableFilters.specs
            .filter((spec) =>
              !["Số chiều", "Công nghệ", "Lọc không khí", "Hiệu suất lọc", "Loại Gas"].includes(spec.label),
            )
            .map((spec) => (
              <FilterGroup
                key={spec.label}
                label={spec.label}
                items={spec.values.map((v) => ({ id: v, name: v }))}
                selectedValues={localSpecs[spec.label] || []}
                selectionCount={(localSpecs[spec.label] || []).length}
                onToggle={(id, checked) => handleSpecChange(spec.label, id, checked)}
                showSearch={spec.label !== "Công suất" && spec.values.length > 8}
                disabled={isPending}
                openItems={openItems}
                setOpenItems={setOpenItems}
              />
            ))}

          {/* Price Range */}
          <FilterSection
            label="Khoảng giá"
            selectionCount={hasPriceFilter ? 1 : 0}
            openItems={openItems}
            setOpenItems={setOpenItems}
          >
            <div className="px-3 pb-2 pt-1">
              <ProductPriceFilter
                hideLabel
                minPriceLimit={availableFilters.minPrice}
                maxPriceLimit={availableFilters.maxPrice}
              />
            </div>
          </FilterSection>

          {/* Condition Filter */}
          <FilterSection
            label="Tình trạng sản phẩm"
            selectionCount={localCondition ? 1 : 0}
            openItems={openItems}
            setOpenItems={setOpenItems}
          >
            <SidebarMenuSub>
              {(["new", "used"] as const).map((val) => (
                <SidebarMenuSubItem key={val}>
                  <SidebarMenuSubButton
                    isActive={localCondition === val}
                    aria-disabled={isPending}
                    onClick={() => handleConditionChange(val, localCondition !== val)}
                    className="cursor-pointer data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    {val === "new" ? "Mới" : "Cũ"}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </FilterSection>
        </SidebarMenu>
      </SidebarGroup>
    </div>
  );
}

function FilterSection({
  label,
  selectionCount = 0,
  openItems,
  setOpenItems,
  children,
}: {
  label: string;
  selectionCount?: number;
  openItems: string[];
  setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
  children: React.ReactNode;
}) {
  const isLocked = selectionCount > 0;
  const isOpen = isLocked || openItems.includes(label);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(open) => {
        if (isLocked && !open) return;
        setOpenItems((prev) =>
          open ? [...prev, label] : prev.filter((v) => v !== label),
        );
      }}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="font-medium">
            <span>{label}</span>
            {!isLocked && (
              <CaretRight className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

interface FilterGroupProps {
  label: string;
  items: { id: string; name: string }[];
  selectedValues: string[];
  selectionCount?: number;
  onToggle: (id: string, checked: boolean) => void;
  showSearch?: boolean;
  disabled?: boolean;
  openItems: string[];
  setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
}

function FilterGroup({
  label,
  items,
  selectedValues,
  selectionCount = 0,
  onToggle,
  showSearch = false,
  disabled = false,
  openItems,
  setOpenItems,
}: FilterGroupProps) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  return (
    <FilterSection
      label={label}
      selectionCount={selectionCount}
      openItems={openItems}
      setOpenItems={setOpenItems}
    >
      {showSearch && (
        <div className="relative px-2 pt-1 pb-1">
          <MagnifyingGlass className="absolute left-4.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm nhanh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
            disabled={disabled}
          />
        </div>
      )}
      <SidebarMenuSub>
        {filteredItems.map((item) => {
          const isSelected = selectedValues.includes(item.id);
          return (
            <SidebarMenuSubItem key={item.id}>
              <SidebarMenuSubButton
                isActive={isSelected}
                aria-disabled={disabled}
                onClick={() => onToggle(item.id, !isSelected)}
                className="cursor-pointer data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
              >
                <span className="leading-snug">{item.name}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        })}
        {filteredItems.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-2 py-1">Không tìm thấy</p>
        )}
      </SidebarMenuSub>
    </FilterSection>
  );
}
