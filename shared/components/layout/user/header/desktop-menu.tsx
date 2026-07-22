"use client";

import { type NavLink, checkActiveLink } from "@/modules/settings/domain/navigation";
import { usePathname } from "next/navigation";
import { DesktopNavItem } from "./nav-item";
import { ProductMegaMenuItem, type BrandNavRef } from "./nav-mega-menu";
import type { CategoryRef, GroupCategoryRef } from "@/shared/lib/group-categories";

const PRODUCT_LINK_HREF = "/san-pham";

interface DesktopMenuProps {
  links: NavLink[];
  groupCategories?: GroupCategoryRef[];
  categoriesList?: CategoryRef[];
  brands?: BrandNavRef[];
}

export function DesktopMenu({
  links,
  groupCategories = [],
  categoriesList = [],
  brands = [],
}: DesktopMenuProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-6 lg:flex">
      {links.map((link) =>
        link.href === PRODUCT_LINK_HREF ? (
          <ProductMegaMenuItem
            key={link.name}
            groupCategories={groupCategories}
            categoriesList={categoriesList}
            brands={brands}
          />
        ) : (
          <DesktopNavItem
            key={link.name}
            link={link}
            isActive={checkActiveLink(link.href, pathname)}
          />
        ),
      )}
    </nav>
  );
}
