"use client";

import {
  type NavLink,
  checkActiveLink,
} from "@/modules/settings/domain/navigation";
import {
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MobileNavItem } from "./nav-item";
import { MobileProductAccordion } from "./mobile-product-accordion";
import type { BrandNavRef } from "./nav-mega-menu";
import type { CategoryRef, GroupCategoryRef } from "@/shared/lib/group-categories";

const PRODUCT_LINK_HREF = "/san-pham";

interface MobileMenuProps {
  links: NavLink[];
  onClose: () => void;
  groupCategories?: GroupCategoryRef[];
  categoriesList?: CategoryRef[];
  brands?: BrandNavRef[];
}

// Dropdown panel content only — the hamburger trigger (wrapped in
// SheetTrigger) lives in header/index.tsx, matching the reference's one
// toggle. Built on shadcn's own Sheet (Radix Dialog) as-is rather than a
// hand-rolled panel: mount/unmount, focus trap, Escape/outside-click
// dismissal, and the slide-in-from-top animation all come from the
// primitive for free.
export function MobileMenu({
  links,
  onClose,
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
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <SheetContent
      side="top"
      showCloseButton={false}
      // !z-[300] matches the convention already used by wishlist-dialog.tsx
      // for the same problem: the default Sheet z-50 sits below the sticky
      // contact actions button (z-[100]), which would otherwise float on
      // top of the open mobile nav. top/h overrides must keep the same
      // `data-[side=top]:` prefix as SheetContent's own base classes
      // (data-[side=top]:top-0, data-[side=top]:h-auto) — a plain `top-16`
      // has lower CSS specificity than that attribute-selector variant, so
      // it silently loses and the panel stays pinned at top-0, covering
      // the header (this was the actual bug, not tailwind-merge).
      className="!z-[300] gap-2 overflow-y-auto border-t bg-background p-4 lg:hidden data-[side=top]:top-16 data-[side=top]:h-[calc(100dvh-4rem)]"
    >
      <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
      <SheetDescription className="sr-only">
        Danh sách liên kết điều hướng của Điện máy ELC
      </SheetDescription>
      {links.map((link) =>
        link.href === PRODUCT_LINK_HREF ? (
          <MobileProductAccordion
            key={link.name}
            groupCategories={groupCategories}
            categoriesList={categoriesList}
            brands={brands}
            onNavigate={onClose}
          />
        ) : (
          <MobileNavItem
            key={link.name}
            link={link}
            isActive={checkActiveLink(link.href, pathname)}
            onClick={onClose}
          />
        ),
      )}
    </SheetContent>
  );
}
