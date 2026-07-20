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
import { Button } from "@/shared/components/ui/button";
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
        <AccordionTrigger className="px-3 py-3 text-2xl font-semibold text-foreground hover:no-underline! [&_[data-slot=accordion-trigger-icon]]:hidden">
          Sản phẩm
        </AccordionTrigger>
        <AccordionContent className="flex h-auto flex-col gap-2 pl-3">
          <Accordion type="single" collapsible className="w-full">
            {groupsWithCategories.map(({ group, categories }) => (
              <AccordionItem key={group.id} value={group.id} className="border-b-0">
                <AccordionTrigger className="py-3 text-xl font-semibold text-foreground hover:no-underline!">
                  {group.name}
                </AccordionTrigger>
                <AccordionContent className="h-auto pl-1">
                  <div className="flex flex-col gap-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/san-pham/${cat.slug}`}
                        onClick={onNavigate}
                        className="flex items-center gap-3 rounded-md py-1.5 text-lg text-muted-foreground no-underline! hover:text-foreground"
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-background">
                          {cat.imageUrl && (
                            <Image
                              src={cat.imageUrl}
                              alt={cat.name}
                              fill
                              sizes="40px"
                              className="object-contain"
                            />
                          )}
                        </div>
                        <span>{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}

            {featuredBrands.length > 0 && (
              <AccordionItem value="thuong-hieu" className="border-b-0">
                <AccordionTrigger className="py-3 text-xl font-semibold text-foreground hover:no-underline!">
                  Thương hiệu
                </AccordionTrigger>
                <AccordionContent className="h-auto pl-1">
                  <div className="flex flex-col gap-1">
                    {featuredBrands.map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/san-pham/${brand.slug}`}
                        onClick={onNavigate}
                        className="flex items-center gap-3 rounded-md py-1.5 text-lg text-muted-foreground no-underline! hover:text-foreground"
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-background">
                          {brand.logoUrl && (
                            <Image
                              src={brand.logoUrl}
                              alt={brand.name}
                              fill
                              sizes="40px"
                              className="object-contain p-1"
                            />
                          )}
                        </div>
                        <span>Tất cả sản phẩm {brand.name}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

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
