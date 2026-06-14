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

interface HeaderProps {
  contacts?: Contact[];
}

export function Header({ contacts = [] }: HeaderProps) {
  const { isMenuOpen, handleMenuToggle, isScrolled } = useHeader();

  const socialContacts = useMemo(() => {
    return getDisplayContacts(contacts, {
      include: ["phone", "zalo", "facebook"],
    });
  }, [contacts]);

  return (
    <div className="sticky top-0 z-200 w-full">
      <header
        className={cn(
          "h-16 bg-background/80 backdrop-blur-sm backdrop-saturate-150 border-b border-dashed border-muted-foreground/35 transition-all duration-500",
          isMenuOpen
            ? ""
            : isScrolled
              ? "bg-background/80 backdrop-blur-sm backdrop-saturate-150"
              : "",
        )}
      >
        <div className="mx-auto h-full w-full max-w-350 border-dashed min-[87.5rem]:border-x min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-8 relative border-muted-foreground/35 flex items-center">
          {/* Left: Logo (flex-1 để cân với cụm bên phải) */}
          <div className="flex flex-1 items-center">
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
              {/* <span className="text-xl font-bold text-primary/80">elc</span> */}
            </Link>
          </div>

          {/* Center: Desktop Menu (căn giữa thật nhờ 2 bên flex-1) */}
          <DesktopMenu links={navLinks} />

          {/* Right: Actions (flex-1 để cân với logo bên trái) */}
          <div className="flex flex-1 items-center justify-end gap-4 lg:pl-3">
            <ThemeToggle />

            {/* Separator line */}
            {socialContacts.length > 0 && (
              <div className="hidden lg:block w-px h-9 bg-muted" />
            )}

            {/* Social Icons */}
            <div className="hidden lg:flex items-center gap-1">
              {socialContacts.map((contact) => (
                <ContactLink
                  key={contact.id}
                  contact={contact}
                  showLabel={false}
                  showValue={false}
                  iconProps={{ size: 24, weight: "bold" }}
                  className="h-9 w-9 text-foreground transition-colors flex items-center justify-center p-0 gap-0 cursor-pointer"
                  iconClassName="size-4.5 flex items-center justify-center"
                  title={contact.label || contact.type}
                />
              ))}
            </div>

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
