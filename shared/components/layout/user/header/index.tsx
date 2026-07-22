"use client";

import { navLinks } from "@/modules/settings/domain/navigation";
import { useIsOverHero } from "@/shared/hooks/use-is-over-hero";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { DesktopMenu } from "./desktop-menu";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { useHeader } from "./use-header";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";

import type { BrandNavRef } from "./nav-mega-menu";
import type { CategoryRef, GroupCategoryRef } from "@/shared/lib/group-categories";

interface HeaderProps {
  contacts?: Contact[];
  groupCategories?: GroupCategoryRef[];
  categoriesList?: CategoryRef[];
  brands?: BrandNavRef[];
}

export function Header({
  contacts = [],
  groupCategories = [],
  categoriesList = [],
  brands = [],
}: HeaderProps) {
  const { isMenuOpen, handleMenuToggle } = useHeader();

  // The dark translucent glass look only makes sense floating over the
  // homepage's full-viewport dark Hero + chat finder region. Elsewhere —
  // and once that region has scrolled past — the header drops the forced
  // `dark` class entirely and follows the page's own current theme
  // (light by default, or dark via the user's own toggle) instead of
  // always reading as a dark glass pill regardless of theme/scroll.
  const isOverHero = useIsOverHero();

  const socialContacts = useMemo(() => {
    return getDisplayContacts(contacts, {
      include: ["phone", "zalo", "facebook"],
    });
  }, [contacts]);

  return (
    // `dark` only applies while isOverHero — the capsule is a dark glass
    // pill floating over the hero+chat region, but everywhere else it
    // should render with whatever theme the rest of the page is actually
    // using (see the doc comment on isOverHero above).
    <div
      className={cn(
        "fixed top-3 inset-x-0 z-200 w-full px-4 md:px-6 lg:px-8",
        isOverHero && "dark",
      )}
    >
      {/* No `overflow-hidden` here (unlike the reference) — the desktop
          mega menu's dropdown is absolutely positioned and must extend
          below this box. The reference never needed to worry about this
          since it only has flat anchor links, no dropdown. The mobile
          panel's own CSS-grid clipping lives one level deeper, inside
          MobileMenu, so it doesn't need this element to clip too. */}
      <header
        className={cn(
          "mx-auto w-full max-w-350 rounded-xl border shadow-sm transition-all duration-500 ease-in-out",
          isOverHero
            ? "border-border/20 bg-muted text-foreground md:bg-background/40"
            : "border-border/40 bg-background text-foreground",
          isMenuOpen && "bg-background",
        )}
      >
        <div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            onClick={() => handleMenuToggle(false)}
            className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo/logo.svg"
              alt="Điện máy ELC"
              width={36}
              height={36}
              style={{ width: "auto" }}
              className="h-8 md:h-9 w-auto"
              priority
            />
          </Link>

          {/* Nav — centered column, desktop only */}
          <DesktopMenu
            links={navLinks}
            groupCategories={groupCategories}
            categoriesList={categoriesList}
            brands={brands}
          />

          {/* Right column: Dark mode, Contact, Hamburger */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle
              variant="ghost"
              className="h-9 w-9 rounded-md hover:bg-muted"
            />

            {socialContacts.length > 0 && (
              <div className="hidden md:flex items-center gap-1">
                {socialContacts.map((contact) => (
                  <ContactLink
                    key={contact.id}
                    contact={contact}
                    showLabel={false}
                    showValue={false}
                    iconProps={{ size: 24, weight: "bold" }}
                    className="h-9 w-9 text-foreground transition-colors flex items-center justify-center p-0 gap-0 cursor-pointer hover:bg-muted rounded-md"
                    iconClassName="size-4.5 flex items-center justify-center"
                    title={contact.label || contact.type}
                  />
                ))}
              </div>
            )}

            {/* Hamburger — "=" to "X" morph, ported from the reference */}
            <button
              type="button"
              aria-label="Toggle Menu"
              aria-expanded={isMenuOpen}
              onClick={() => handleMenuToggle(!isMenuOpen)}
              className="relative flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-md text-foreground transition-colors hover:bg-muted lg:hidden"
            >
              <span
                className={cn(
                  "h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-300 ease-in-out",
                  isMenuOpen ? "translate-y-[3.5px] rotate-45" : "",
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-300 ease-in-out",
                  isMenuOpen ? "-translate-y-[3.5px] -rotate-45" : "",
                )}
              />
            </button>
          </div>
        </div>

        <MobileMenu
          links={navLinks}
          isOpen={isMenuOpen}
          onOpenChange={handleMenuToggle}
          groupCategories={groupCategories}
          categoriesList={categoriesList}
          brands={brands}
        />
      </header>
    </div>
  );
}
