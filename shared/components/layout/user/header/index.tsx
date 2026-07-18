"use client";

import { navLinks } from "@/modules/settings/domain/navigation";
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

import { HeaderSearch } from "./header-search";
import { HeaderWishlistLink } from "./header-wishlist-link";
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

  const socialContacts = useMemo(() => {
    return getDisplayContacts(contacts, {
      include: ["phone", "zalo", "facebook"],
    });
  }, [contacts]);

  return (
    <div className="sticky top-0 z-200 w-full">
      <header
        className={cn(
          "bg-background/80 backdrop-blur-sm backdrop-saturate-150 border-b border-border/40 transition-all duration-500",
          isMenuOpen ? "bg-background" : "",
        )}
      >
        <div className="mx-auto h-16 w-full max-w-350 px-4 md:px-6 lg:px-8 flex items-center justify-between border-dashed border-muted-foreground/35">
          {/* Left Column: Logo & Nav link */}
          <div className="flex items-center gap-6 xl:gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80"
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
            <DesktopMenu
              links={navLinks}
              groupCategories={groupCategories}
              categoriesList={categoriesList}
              brands={brands}
            />
          </div>

          {/* Right Column: Search, Dark mode button, Contact */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search */}
            <div className="w-24 min-[375px]:w-28 min-[425px]:w-32 sm:w-40 md:w-44 lg:w-48 xl:w-56 shrink-0">
              <HeaderSearch />
            </div>

            {/* Wishlist */}
            <HeaderWishlistLink />

            {/* Dark mode toggle */}
            <ThemeToggle
              variant="ghost"
              className="h-9 w-9 rounded-md hover:bg-muted"
            />

            {/* Contact links - Desktop only */}
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

            {/* Mobile Menu (includes Search & Contact inside drawer) */}
            <MobileMenu
              links={navLinks}
              isOpen={isMenuOpen}
              onOpenChange={handleMenuToggle}
              socialContacts={socialContacts}
              groupCategories={groupCategories}
              categoriesList={categoriesList}
              brands={brands}
            />
          </div>
        </div>
      </header>
    </div>
  );
}
