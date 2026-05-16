"use client";

import { navLinks } from "@/modules/settings/domain/navigation";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import { DesktopMenu } from "./desktop-menu";
import { MobileMenu } from "./mobile-menu";
import { useHeader } from "./use-header";

export function Header() {
  const { isMenuOpen, handleMenuToggle, isScrolled } = useHeader();

  return (
    <div className="sticky top-0 z-[1000] w-full">
      <header
        className={cn(
          "h-16 border-b border-dashed border-muted-foreground/40 transition-all duration-500",
          isMenuOpen
            ? "bg-background"
            : isScrolled
              ? "bg-background/55 backdrop-blur-md"
              : "",
        )}
      >
        <div className="flex h-full items-center justify-between px-6 md:px-7 lg:px-8">
          <Link
            href="/"
            className="flex items-center shrink-0 transition-opacity hover:opacity-80"
          >
            <img
              src="/logo/logo.svg"
              alt="Điện máy ELC"
              className="h-8 md:h-9 lg:h-10 w-auto"
            />
          </Link>

          <DesktopMenu links={navLinks} />

          <div className="flex items-center gap-3">
            <MobileMenu
              links={navLinks}
              isOpen={isMenuOpen}
              onOpenChange={handleMenuToggle}
            />
          </div>
        </div>
      </header>
    </div>
  );
}
