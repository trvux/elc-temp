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
import { Sheet, SheetTrigger } from "@/shared/components/ui/sheet";

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

  // Fully transparent while over the homepage's full-viewport Hero + chat
  // finder region; once scrolled past it, the header picks up a solid
  // (blurred) background instead. Only the transparent state forces the
  // `dark` scope — the hero photo behind it is always visually dark/blue
  // regardless of the site's actual light/dark setting, so icons and text
  // need guaranteed light-on-transparent contrast there. Once there's a
  // solid bg-background underneath (scrolled, or menu open), the header
  // drops the forced dark and just follows the page's real theme.
  const isOverHero = useIsOverHero();
  // True only while actually rendering the transparent-over-hero look
  // (menu-open always forces a solid bg regardless of isOverHero) — hover
  // fills on the icon buttons are suppressed in this state so they stay
  // fully transparent instead of flashing a solid muted box on hover.
  const isTransparent = isOverHero && !isMenuOpen;

  const socialContacts = useMemo(() => {
    return getDisplayContacts(contacts, {
      include: ["phone", "zalo", "facebook"],
    });
  }, [contacts]);

  return (
    <header
      className={cn(
        // Only background-color/border-color animate here — height and
        // backdrop-blur are deliberately left out of the transition (both
        // force the browser to re-layout/re-composite every frame, which
        // read as visible jank when the hamburger toggled the old
        // grow-to-h-dvh header). The header's own box stays a fixed h-16
        // always; MobileMenu below covers the rest of the viewport as its
        // own independent fixed overlay instead of growing this element.
        "fixed top-0 inset-x-0 z-200 w-full text-foreground transition-colors duration-500 ease-in-out",
        isMenuOpen
          ? "bg-background"
          : isTransparent
            ? "dark bg-transparent"
            : "border-b border-border/40 bg-background/80 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-350 min-[112.5rem]:max-w-384 items-center justify-between px-4 md:px-6 lg:px-8">
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
            className={cn(
              "h-9 w-9 rounded-md",
              isTransparent ? "hover:bg-transparent" : "hover:bg-muted",
            )}
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
                  className={cn(
                    "h-9 w-9 text-foreground transition-colors flex items-center justify-center p-0 gap-0 cursor-pointer rounded-md",
                    isTransparent ? "hover:bg-transparent" : "hover:bg-muted",
                  )}
                  iconClassName="size-4.5 flex items-center justify-center"
                  title={contact.label || contact.type}
                />
              ))}
            </div>
          )}

          {/* Hamburger — "=" to "X" morph, ported from the reference. Wrapped
              as a SheetTrigger so Radix toggles the controlled `open` state
              itself on click, so this has no onClick of its own. */}
          <Sheet open={isMenuOpen} onOpenChange={handleMenuToggle}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Toggle Menu"
                className={cn(
                  "relative flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-md text-foreground transition-colors lg:hidden",
                  isTransparent ? "hover:bg-transparent" : "hover:bg-muted",
                )}
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
            </SheetTrigger>

            <MobileMenu
              links={navLinks}
              onClose={() => handleMenuToggle(false)}
              groupCategories={groupCategories}
              categoriesList={categoriesList}
              brands={brands}
            />
          </Sheet>
        </div>
      </div>
    </header>
  );
}
