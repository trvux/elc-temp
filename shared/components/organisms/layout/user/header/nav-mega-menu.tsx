"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/shared/components/ui/button";
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

// Small grace period before closing on mouse-out, so crossing the gap
// between the trigger and the panel below it doesn't flicker-close.
const CLOSE_DELAY_MS = 150;

// The "Sản phẩm" nav item — a self-contained hover/click dropdown instead
// of a plain flat link: a left rail listing groups plus a trailing
// "Thương hiệu" entry (hover to switch), and the active entry's items
// (categories or brands) shown as image cards in the panel. Built by hand
// (no Radix NavigationMenu root) so it can sit inside the reference-style
// flat nav bar in `desktop-menu.tsx`; the open/close, outside-click, and
// Escape handling below is what NavigationMenu would otherwise give for
// free. Data is already fetched server-side in app/(public)/layout.tsx
// (same arrays Footer uses) and passed down as props, so this component
// only shapes/renders — no client-side fetch, no loading state.
export function ProductMegaMenuItem({
  groupCategories,
  categoriesList,
  brands,
}: ProductMegaMenuItemProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [open, setOpen] = useState(false);

  // Close on route change — adjusted during render (React's documented
  // alternative to a setState-in-effect) rather than an effect, since this
  // is deriving state from a prop, not synchronizing with an external
  // system: https://react.dev/learn/you-might-not-need-an-effect
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

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

  const closeMenu = () => setOpen(false);

  const cancelClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(closeMenu, CLOSE_DELAY_MS);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) closeMenu();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => cancelClose, []);

  return (
    <div
      ref={containerRef}
      // h-16 matches the header topbar's own height so this container's
      // bottom edge lines up with the header's bottom edge — otherwise
      // `top-full` below would measure from the trigger's own (much
      // shorter) box instead of the header capsule itself.
      className="relative flex h-16 items-center"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "text-sm font-medium transition-colors",
          open ? "text-foreground" : "text-foreground/70 hover:text-foreground",
        )}
      >
        Sản phẩm
      </button>

      <div
        className={cn(
          // bg-popover (lighter than bg-background) + a visible white-tinted
          // border/shadow so the panel reads as a distinct surface floating
          // over the page instead of blending into a dark hero behind it.
          "absolute left-1/2 top-full z-10 mt-2 w-240 max-w-[90vw] -translate-x-1/2 rounded-2xl border border-white/15 bg-popover p-4 shadow-2xl ring-1 ring-black/5 transition-all duration-200 ease-out",
          open
            ? "visible translate-y-0 opacity-100 pointer-events-auto"
            : "invisible -translate-y-1 opacity-0 pointer-events-none",
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[180px_1fr] gap-6">
            <div className="flex flex-col gap-1">
              <TypographyLarge className="pl-3 pb-1">
                Danh mục
              </TypographyLarge>
              {groupsWithCategories.map(({ group }) => (
                <Link
                  key={group.id}
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
                    <Link
                      key={brand.id}
                      href={`/san-pham/${brand.slug}`}
                      className="group flex flex-col gap-2 rounded-md p-2 transition-colors hover:bg-accent/60"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-white">
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
                  ))}
                </div>
              ) : activeGroup && activeGroup.categories.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {activeGroup.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/san-pham/${cat.slug}`}
                      className="group flex flex-col gap-2 rounded-md p-2 transition-colors hover:bg-accent/60"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-white">
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
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có danh mục con.
                </p>
              )}
            </div>
          </div>

          <Button variant="link" size="lg" className="w-fit self-center" asChild>
            <Link href="/san-pham">Xem tất cả sản phẩm</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
