"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
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
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="san-pham" className="border-b-0">
        <AccordionTrigger className="px-3 py-3 text-xl font-bold text-foreground hover:no-underline!">
          Sản phẩm
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-6 pl-3">
          {groupsWithCategories.map(({ group, categories }) => (
            <div key={group.id} className="flex flex-col gap-2.5">
              <Link
                href={`/san-pham/${group.slug}`}
                onClick={onNavigate}
                className="text-base font-semibold text-foreground no-underline!"
              >
                {group.name}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/san-pham/${cat.slug}`}
                  onClick={onNavigate}
                  className="text-base text-muted-foreground no-underline! hover:text-foreground"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          ))}

          {featuredBrands.length > 0 && (
            <div className="flex flex-col gap-4 pt-5 border-t border-border/40">
              <TypographySmall className="text-base font-semibold text-foreground">
                Thương hiệu
              </TypographySmall>
              <div className="flex flex-col gap-2.5">
                {featuredBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/san-pham/${brand.slug}`}
                    onClick={onNavigate}
                    className="text-base text-muted-foreground no-underline! hover:text-foreground"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" className="mt-1 w-full no-underline!" asChild>
            <Link href="/san-pham" onClick={onNavigate}>
              Xem tất cả sản phẩm
            </Link>
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
