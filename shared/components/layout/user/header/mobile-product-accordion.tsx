"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { TypographySmall } from "@/shared/components/ui/typography";
import { groupCategoriesByGroup, type CategoryRef, type GroupCategoryRef } from "@/shared/lib/group-categories";
import { sortByOrderIndex } from "@/shared/lib/helpers";
import type { BrandNavRef } from "./nav-mega-menu";

interface MobileProductAccordionProps {
  groupCategories: GroupCategoryRef[];
  categoriesList: CategoryRef[];
  brands: BrandNavRef[];
  onNavigate?: () => void;
}

const FEATURED_BRANDS_CAP = 8;

// Mobile equivalent of ProductMegaMenuItem — nests inside the existing
// full-screen mobile menu panel (mobile-menu.tsx) in place of the flat
// "Sản phẩm" link, using shadcn Accordion rather than a separate Sheet, so
// the rest of the mobile menu stays untouched.
export function MobileProductAccordion({
  groupCategories,
  categoriesList,
  brands,
  onNavigate,
}: MobileProductAccordionProps) {
  const groupsWithCategories = useMemo(
    () => groupCategoriesByGroup(groupCategories, categoriesList),
    [groupCategories, categoriesList],
  );

  const featuredBrands = useMemo(
    () => sortByOrderIndex(brands.filter((b) => b.isFeatured)).slice(0, FEATURED_BRANDS_CAP),
    [brands],
  );

  return (
    <Accordion type="single" collapsible className="w-full max-w-xs">
      <AccordionItem value="san-pham" className="border-b-0">
        <AccordionTrigger className="justify-center gap-2 text-xl font-medium text-muted-foreground hover:text-foreground hover:no-underline py-0">
          Sản phẩm
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 pt-4 text-center">
          {groupsWithCategories.map(({ group, categories }) => (
            <div key={group.id} className="flex flex-col gap-1.5">
              <Link
                href={`/san-pham/${group.slug}`}
                onClick={onNavigate}
                className="text-sm font-semibold text-foreground"
              >
                {group.name}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/san-pham/${cat.slug}`}
                  onClick={onNavigate}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          ))}

          {featuredBrands.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              <TypographySmall className="font-semibold text-muted-foreground uppercase tracking-wide">
                Thương hiệu
              </TypographySmall>
              <div className="grid grid-cols-3 gap-2">
                {featuredBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/san-pham/${brand.slug}`}
                    onClick={onNavigate}
                    className="flex items-center justify-center rounded-md border border-border p-2"
                    title={brand.name}
                  >
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name}
                        width={56}
                        height={20}
                        className="h-5 w-auto object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{brand.name}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href="/san-pham" onClick={onNavigate} className="text-sm text-primary">
            Xem tất cả sản phẩm →
          </Link>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
