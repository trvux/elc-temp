"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/shared/components/ui/navigation-menu";
import { TypographyLarge } from "@/shared/components/ui/typography";
import {
  groupCategoriesByGroup,
  type CategoryRef,
  type GroupCategoryRef,
} from "@/shared/lib/group-categories";
import { sortByOrderIndex } from "@/shared/lib/helpers";
import { cn } from "@/shared/lib/utils";

export interface BrandNavRef {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
}

interface ProductMegaMenuItemProps {
  groupCategories: GroupCategoryRef[];
  categoriesList: CategoryRef[];
  brands: BrandNavRef[];
}

const FEATURED_BRANDS_CAP = 8;

// Sentinel rail entry id for the brands section, kept alongside group ids
// in the same left-rail state so "Thương hiệu" behaves like just another
// group instead of a separate column.
const BRANDS_RAIL_ID = "__brands__";

// The "Sản phẩm" nav item — replaces a plain flat link with a dropdown:
// a left rail listing groups plus a trailing "Thương hiệu" entry (hover to
// switch), and the active entry's items (categories or brands) shown as
// image cards in the middle panel. Data is already fetched server-side in
// app/(public)/layout.tsx (same arrays Footer uses) and passed down as
// props, so this component only shapes/renders — no client-side fetch, no
// loading state.
export function ProductMegaMenuItem({
  groupCategories,
  categoriesList,
  brands,
}: ProductMegaMenuItemProps) {
  const groupsWithCategories = useMemo(
    () => groupCategoriesByGroup(groupCategories, categoriesList),
    [groupCategories, categoriesList],
  );

  const featuredBrands = useMemo(
    () =>
      sortByOrderIndex(brands.filter((b) => b.isFeatured)).slice(
        0,
        FEATURED_BRANDS_CAP,
      ),
    [brands],
  );

  const [activeRailId, setActiveRailId] = useState<string | null>(
    groupsWithCategories[0]?.group.id ?? null,
  );

  const activeGroup = groupsWithCategories.find(
    (g) => g.group.id === activeRailId,
  );
  const isBrandsActive =
    activeRailId === BRANDS_RAIL_ID ||
    (!activeGroup && groupsWithCategories.length === 0);

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Sản phẩm</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="flex flex-col gap-4 w-240 max-w-[90vw] p-4">
          <div className="grid grid-cols-[180px_1fr] gap-6">
            <div className="flex flex-col gap-1">
              <TypographyLarge className="pl-3 pb-1">
                Danh mục
              </TypographyLarge>
              {groupsWithCategories.map(({ group }) => (
                <NavigationMenuLink asChild key={group.id}>
                  <Link
                    href={`/san-pham/${group.slug}`}
                    onMouseEnter={() => setActiveRailId(group.id)}
                    onFocus={() => setActiveRailId(group.id)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      !isBrandsActive && group.id === activeGroup?.group.id
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/60",
                    )}
                  >
                    {group.name}
                  </Link>
                </NavigationMenuLink>
              ))}
              {featuredBrands.length > 0 && (
                <Link
                  href="/san-pham"
                  onMouseEnter={() => setActiveRailId(BRANDS_RAIL_ID)}
                  onFocus={() => setActiveRailId(BRANDS_RAIL_ID)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isBrandsActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/60",
                  )}
                >
                  Thương hiệu
                </Link>
              )}
            </div>

            <div className="min-w-0 border-l pl-6">
              {isBrandsActive ? (
                <div className="grid grid-cols-6 gap-3">
                  {featuredBrands.map((brand) => (
                    <NavigationMenuLink asChild key={brand.id}>
                      <Link
                        href={`/san-pham/${brand.slug}`}
                        className="group flex flex-col gap-2 rounded-md p-2 transition-colors hover:bg-accent/60"
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-background">
                          {brand.logoUrl ? (
                            <Image
                              src={brand.logoUrl}
                              alt={brand.name}
                              fill
                              sizes="120px"
                              className="object-contain p-2 transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                              {brand.name}
                            </span>
                          )}
                        </div>
                        <span className="text-center text-sm text-foreground line-clamp-2">
                          {brand.name}
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </div>
              ) : activeGroup && activeGroup.categories.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {activeGroup.categories.map((cat) => (
                    <NavigationMenuLink asChild key={cat.id}>
                      <Link
                        href={`/san-pham/${cat.slug}`}
                        className="group flex flex-col gap-2 rounded-md p-2 transition-colors hover:bg-accent/60"
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-background">
                          {cat.imageUrl ? (
                            <Image
                              src={cat.imageUrl}
                              alt={cat.name}
                              fill
                              sizes="120px"
                              className="object-contain transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                              {cat.name}
                            </span>
                          )}
                        </div>
                        <span className="text-center text-sm text-foreground line-clamp-2">
                          {cat.name}
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có danh mục con.
                </p>
              )}
            </div>
          </div>

          <Button
            variant="link"
            size="lg"
            className="w-fit self-center"
            asChild
          >
            <Link href="/san-pham">Xem tất cả sản phẩm</Link>
          </Button>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
