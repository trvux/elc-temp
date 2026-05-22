"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { Search, X, Check } from "lucide-react";

interface ServiceTypeItem {
  id: string;
  name: string;
  slug: string;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ProjectFilterBarProps {
  serviceTypes: ServiceTypeItem[];
  currentServiceTypeSlug?: string;
  categories: CategoryItem[];
  currentCategorySlugs?: string[];
  initialSearch?: string;
}

export function ProjectFilterBar({
  serviceTypes,
  currentServiceTypeSlug = "",
  categories,
  currentCategorySlugs = [],
  initialSearch = "",
}: ProjectFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);

  // Sync state with URL search param on external updates (e.g. browser back/forward)
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const handleServiceTypeSelect = (slug: string | null) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page"); // Reset pagination on filter change

    // Construct the new path
    const newPathname = slug ? `/du-an/${slug}` : "/du-an";

    startTransition(() => {
      router.push(`${newPathname}?${sParams.toString()}`, { scroll: false });
    });
  };

  const handleCategoryToggle = (slug: string | null) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page"); // Reset pagination on filter change

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
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateSearchUrl(search.trim());
  };

  const handleClearSearch = () => {
    setSearch("");
    updateSearchUrl("");
  };

  const updateSearchUrl = (searchQuery: string) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page"); // Reset pagination on filter change

    if (searchQuery) {
      sParams.set("search", searchQuery);
    } else {
      sParams.delete("search");
    }

    startTransition(() => {
      router.push(`${pathname}?${sParams.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md mx-auto sm:mx-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm dự án..."
            value={search}
            onChange={handleSearchChange}
            className="pl-10 pr-10 py-5 w-full bg-background border-border hover:border-foreground/20 focus-visible:ring-primary rounded-md text-sm transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Row 1: Service Type Single-Select Filter */}
      {serviceTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/75">
            Lọc theo loại hình dịch vụ
          </span>
          <div className="w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 py-2 border-b border-border/40">
            <button
              type="button"
              onClick={() => handleServiceTypeSelect(null)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-full border transition-all shrink-0 select-none",
                !currentServiceTypeSlug
                  ? "bg-primary border-primary text-primary-foreground shadow-sm font-bold"
                  : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              )}
            >
              Tất cả loại hình
            </button>
            {serviceTypes.map((st) => {
              const isActive = currentServiceTypeSlug === st.slug;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleServiceTypeSelect(st.slug)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-full border transition-all shrink-0 select-none",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground shadow-sm font-bold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  )}
                >
                  {st.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 2: Product Category Multi-Select Filter */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/75">
            Lọc theo dòng sản phẩm
          </span>
          <div className="w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 py-2 border-b border-border/40">
            <button
              type="button"
              onClick={() => handleCategoryToggle(null)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-full border transition-all shrink-0 select-none",
                currentCategorySlugs.length === 0
                  ? "bg-primary border-primary text-primary-foreground shadow-sm font-bold"
                  : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              )}
            >
              Tất cả sản phẩm
            </button>
            {categories.map((cat) => {
              const isActive = currentCategorySlugs.includes(cat.slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryToggle(cat.slug)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-full border transition-all shrink-0 select-none flex items-center gap-1.5",
                    isActive
                      ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  )}
                >
                  {isActive && <Check className="w-3.5 h-3.5" />}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
