"use client";

import {
  type NavLink,
  checkActiveLink,
} from "@/modules/settings/domain/navigation";
import { cn } from "@/shared/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MobileNavItem } from "./nav-item";
import { MobileProductAccordion } from "./mobile-product-accordion";
import type { BrandNavRef } from "./nav-mega-menu";
import type { CategoryRef, GroupCategoryRef } from "@/shared/lib/group-categories";

const PRODUCT_LINK_HREF = "/san-pham";

interface MobileMenuProps {
  links: NavLink[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupCategories?: GroupCategoryRef[];
  categoriesList?: CategoryRef[];
  brands?: BrandNavRef[];
}

// Dropdown panel content only — the hamburger trigger lives in
// header/index.tsx (one toggle, matching the reference). Uses the
// reference's CSS Grid height-animation technique (`grid-rows-[0fr]` →
// `[1fr]`) so it collapses/expands inside the header's own rounded
// capsule, instead of a full-viewport overlay.
export function MobileMenu({
  links,
  isOpen,
  onOpenChange,
  groupCategories = [],
  categoriesList = [],
  brands = [],
}: MobileMenuProps) {
  const pathname = usePathname();

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      className={cn(
        "grid transition-all duration-500 ease-in-out lg:hidden",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!isOpen}
    >
      <div className="overflow-hidden">
        <div className="flex max-h-[calc(100svh-7rem)] flex-col gap-2 overflow-y-auto border-t border-border/40 px-4 py-4">
          {links.map((link) =>
            link.href === PRODUCT_LINK_HREF ? (
              <MobileProductAccordion
                key={link.name}
                groupCategories={groupCategories}
                categoriesList={categoriesList}
                brands={brands}
                onNavigate={() => onOpenChange(false)}
              />
            ) : (
              <MobileNavItem
                key={link.name}
                link={link}
                isActive={checkActiveLink(link.href, pathname)}
                onClick={() => onOpenChange(false)}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
