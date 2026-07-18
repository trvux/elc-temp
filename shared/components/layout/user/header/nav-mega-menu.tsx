"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/shared/components/ui/navigation-menu";
import { Separator } from "@/shared/components/ui/separator";
import { TypographySmall } from "@/shared/components/ui/typography";
import { groupCategoriesByGroup, type CategoryRef, type GroupCategoryRef } from "@/shared/lib/group-categories";
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
    () => sortByOrderIndex(brands.filter((b) => b.isFeatured)).slice(0, FEATURED_BRANDS_CAP),
    [brands],
  );

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Sản phẩm</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid grid-cols-[1fr_auto] gap-6 w-[720px] max-w-[90vw] p-2">
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            {groupsWithCategories.map(({ group, categories }) => (
              <div key={group.id} className="flex flex-col gap-1.5 min-w-0">
                <NavigationMenuLink asChild>
                  <Link href={`/san-pham/${group.slug}`} className="font-semibold text-sm">
                    {group.name}
                  </Link>
                </NavigationMenuLink>
                {categories.map((cat) => (
                  <NavigationMenuLink asChild key={cat.id}>
                    <Link href={`/san-pham/${cat.slug}`} className="text-sm text-muted-foreground">
                      {cat.name}
                    </Link>
                  </NavigationMenuLink>
                ))}
              </div>
            ))}
          </div>

          {featuredBrands.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-auto" />
              <div className="flex flex-col gap-2 w-48 shrink-0">
                <TypographySmall className="font-semibold text-muted-foreground uppercase tracking-wide">
                  Thương hiệu
                </TypographySmall>
                <div className="grid grid-cols-2 gap-2">
                  {featuredBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/san-pham/${brand.slug}`}
                      className="flex items-center justify-center rounded-md border border-border p-2 transition-colors hover:border-primary/40"
                      title={brand.name}
                    >
                      {brand.logoUrl ? (
                        <Image
                          src={brand.logoUrl}
                          alt={brand.name}
                          width={64}
                          height={24}
                          className="h-6 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">{brand.name}</span>
                      )}
                    </Link>
                  ))}
                </div>
                <NavigationMenuLink asChild className="mt-auto">
                  <Link href="/san-pham" className="text-sm text-primary">
                    Xem tất cả sản phẩm →
                  </Link>
                </NavigationMenuLink>
              </div>
            </>
          )}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
