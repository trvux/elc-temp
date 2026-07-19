"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

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

// The "Sản phẩm" nav item — replaces a plain flat link with a two-column
// dropdown: categories grouped by Group (left), featured brands (right).
// Data is already fetched server-side in app/(public)/layout.tsx (same
// arrays Footer uses) and passed down as props, so this component only
// shapes/renders — no client-side fetch, no loading state.
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

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Sản phẩm</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="flex flex-col gap-4 w-220 max-w-[90vw] p-4">
          <div className="grid grid-cols-[1fr_auto] gap-10">
            <div className="flex flex-col gap-3">
              <TypographyLarge className="pl-5">Danh mục</TypographyLarge>
              <div className="columns-3 gap-x-2">
                {groupsWithCategories.map(({ group, categories }) => (
                  <div
                    key={group.id}
                    className="mb-2 flex flex-col gap-1.5 min-w-0 break-inside-avoid 1 rounded-md p-3"
                  >
                    <NavigationMenuLink asChild>
                      <Link
                        href={`/san-pham/${group.slug}`}
                        className="font-semibold text-sm"
                      >
                        {group.name}
                      </Link>
                    </NavigationMenuLink>
                    {categories.map((cat) => (
                      <NavigationMenuLink asChild key={cat.id}>
                        <Link
                          href={`/san-pham/${cat.slug}`}
                          className="text-sm text-muted-foreground"
                        >
                          {cat.name}
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {featuredBrands.length > 0 && (
              <div className="flex flex-col items-center gap-3 w-48 shrink-0">
                <TypographyLarge>Thương hiệu</TypographyLarge>
                <div className="flex flex-col items-center gap-4 p-3">
                  {featuredBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/san-pham/${brand.slug}`}
                      className="flex h-9 w-24 items-center justify-center p-1 transition-opacity hover:opacity-70"
                      title={brand.name}
                    >
                      {brand.logoUrl ? (
                        <Image
                          src={brand.logoUrl}
                          alt={brand.name}
                          width={96}
                          height={36}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {brand.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
