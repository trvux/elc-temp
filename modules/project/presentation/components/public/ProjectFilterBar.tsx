"use client";

import { Button } from "@/shared/components/ui/button";
import { TypographyLarge } from "@/shared/components/ui/typography";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState, useTransition } from "react";

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

interface ProjectFilterBarProps {
  serviceTypes: ServiceTypeItem[];
  currentServiceTypeSlug?: string;
  categories: CategoryItem[];
  currentCategorySlugs?: string[];
  initialSearch?: string;
  totalServiceTypesCount?: number;
  totalCategoriesCount?: number;
}

export function ProjectFilterBar({
  serviceTypes,
  currentServiceTypeSlug = "",
  categories,
  currentCategorySlugs = [],
  initialSearch = "",
  totalServiceTypesCount,
  totalCategoriesCount,
}: ProjectFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);

  const serviceTypesRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  const [showLeftST, setShowLeftST] = useState(false);
  const [showRightST, setShowRightST] = useState(false);
  const [showLeftCat, setShowLeftCat] = useState(false);
  const [showRightCat, setShowRightCat] = useState(false);

  const checkScroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    setShowLeft: (show: boolean) => void,
    setShowRight: (show: boolean) => void,
  ) => {
    const el = ref.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeft(scrollLeft > 5);
      setShowRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  const scroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right",
  ) => {
    const el = ref.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.6;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const stEl = serviceTypesRef.current;
    const catEl = categoriesRef.current;

    const handleSTScroll = () =>
      checkScroll(serviceTypesRef, setShowLeftST, setShowRightST);
    const handleCatScroll = () =>
      checkScroll(categoriesRef, setShowLeftCat, setShowRightCat);

    // Initial check
    checkScroll(serviceTypesRef, setShowLeftST, setShowRightST);
    checkScroll(categoriesRef, setShowLeftCat, setShowRightCat);

    stEl?.addEventListener("scroll", handleSTScroll);
    catEl?.addEventListener("scroll", handleCatScroll);

    const resizeObserver = new ResizeObserver(() => {
      checkScroll(serviceTypesRef, setShowLeftST, setShowRightST);
      checkScroll(categoriesRef, setShowLeftCat, setShowRightCat);
    });

    if (stEl) resizeObserver.observe(stEl);
    if (catEl) resizeObserver.observe(catEl);

    return () => {
      stEl?.removeEventListener("scroll", handleSTScroll);
      catEl?.removeEventListener("scroll", handleCatScroll);
      resizeObserver.disconnect();
    };
  }, [serviceTypes, categories]);

  // Sync state with URL search param on external updates (e.g. browser back/forward)
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const handleServiceTypeSelect = (slug: string | null) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page"); // Reset pagination on filter change
    sParams.delete("category"); // Reset categories when deselecting or changing service type

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
      {/* Premium Loading Progress Bar during transitions */}
      {isPending && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-muted z-[9999] overflow-hidden">
          <div className="h-full bg-linear-to-r from-primary via-primary/80 to-primary animate-loading-bar" />
        </div>
      )}
      {/* Search Input Box */}
      {/* <form
        onSubmit={handleSearchSubmit}
        className="relative w-full max-w-md mx-auto sm:mx-0"
      >
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
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form> */}
      {/* Row 1: Service Type Single-Select Filter */}
      {serviceTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          <TypographyLarge>Không gian kiến trúc</TypographyLarge>
          <div className="relative w-full">
            {showLeftST && (
              <div className="absolute left-0 top-0 bottom-0 flex items-center justify-start bg-linear-to-r from-background via-background/90 to-transparent pr-10 pointer-events-none z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 pointer-events-auto flex items-center justify-center cursor-pointer"
                  onClick={() => scroll(serviceTypesRef, "left")}
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            )}
            <div
              ref={serviceTypesRef}
              className="w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 pr-12"
            >
              <Button
                variant={!currentServiceTypeSlug ? "default" : "secondary"}
                size="sm"
                className="cursor-pointer"
                disabled={isPending}
                onClick={() => handleServiceTypeSelect(null)}
              >
                Tất cả loại hình
                {/* {totalServiceTypesCount !== undefined && (
                  <span className="border-l border-border/60 pl-2 ml-2 text-xs">
                    {totalServiceTypesCount}
                  </span>
                )} */}
              </Button>
              {serviceTypes.map((st) => {
                if (st.count !== undefined && st.count <= 0) return null;
                const isActive = currentServiceTypeSlug === st.slug;
                return (
                  <Button
                    key={st.id}
                    variant={isActive ? "default" : "secondary"}
                    size="sm"
                    className="cursor-pointer"
                    disabled={isPending}
                    onClick={() => handleServiceTypeSelect(st.slug)}
                  >
                    {st.name}
                    {/* {st.count !== undefined && (
                      <span className="border-l border-border pl-2 ml-2 text-xs">
                        {st.count}
                      </span>
                    )} */}
                  </Button>
                );
              })}
            </div>
            {showRightST && (
              <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end bg-linear-to-l from-background via-background/90 to-transparent pl-10 pointer-events-none z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 pointer-events-auto flex items-center justify-center cursor-pointer"
                  onClick={() => scroll(serviceTypesRef, "right")}
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Row 2: Product Category Multi-Select Filter */}
      {currentServiceTypeSlug && categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <TypographyLarge>Thiết bị lắp đặt</TypographyLarge>
          <div className="relative w-full">
            {showLeftCat && (
              <div className="absolute left-0 top-0 bottom-0 flex items-center justify-start bg-linear-to-r from-background via-background/90 to-transparent pr-10 pointer-events-none z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 pointer-events-auto flex items-center justify-center cursor-pointer"
                  onClick={() => scroll(categoriesRef, "left")}
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            )}
            <div
              ref={categoriesRef}
              className="w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 pr-12"
            >
              <Button
                variant={
                  currentCategorySlugs.length === 0 ? "default" : "secondary"
                }
                size="sm"
                className="cursor-pointer"
                disabled={isPending}
                onClick={() => handleCategoryToggle(null)}
              >
                Tất cả sản phẩm
                {/* {totalCategoriesCount !== undefined && (
                  <span className="border-l border-border/60 pl-2 ml-2 text-xs">
                    {totalCategoriesCount}
                  </span>
                )} */}
              </Button>
              {categories.map((cat) => {
                if (cat.count !== undefined && cat.count <= 0) return null;
                const isActive = currentCategorySlugs.includes(cat.slug);
                return (
                  <Button
                    key={cat.id}
                    variant={isActive ? "default" : "secondary"}
                    size="sm"
                    className="cursor-pointer"
                    disabled={isPending}
                    onClick={() => handleCategoryToggle(cat.slug)}
                  >
                    {isActive && (
                      <Check icon-data="inline-start" className="w-3.5 h-3.5" />
                    )}
                    {cat.name}
                    {/* {cat.count !== undefined && (
                      <span className="border-l border-border pl-2 ml-2 text-xs">
                        {cat.count}
                      </span>
                    )} */}
                  </Button>
                );
              })}
            </div>
            {showRightCat && (
              <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end bg-linear-to-l from-background via-background/90 to-transparent pl-10 pointer-events-none z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 pointer-events-auto flex items-center justify-center cursor-pointer"
                  onClick={() => scroll(categoriesRef, "right")}
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
