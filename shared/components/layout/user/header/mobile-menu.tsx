"use client";

import {
  type NavLink,
  checkActiveLink,
} from "@/modules/settings/domain/navigation";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { usePathname } from "next/navigation";
import { Portal } from "radix-ui";
import { useEffect, useRef } from "react";
import { MobileNavItem } from "./nav-item";
import { type Contact } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";

interface MobileMenuProps {
  links: NavLink[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  socialContacts?: Contact[];
}

export function MobileMenu({
  links,
  isOpen,
  onOpenChange,
  socialContacts = [],
}: MobileMenuProps) {
  const pathname = usePathname();

  // Close menu on route change (skip initial mount)
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="default"
        className="flex lg:hidden items-center justify-start gap-2.5 p-0! h-8 bg-transparent! hover:bg-transparent! focus-visible:bg-transparent! focus-visible:ring-0 active:bg-transparent!"
        aria-label="Toggle Menu"
        aria-expanded={isOpen}
        onClick={() => onOpenChange(!isOpen)}
      >
        <div className="relative flex h-8 w-4 items-center justify-center">
          <div className="relative size-4">
            <span
              className={cn(
                "absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-100",
                isOpen ? "top-[0.4rem] -rotate-45" : "top-1",
              )}
            />
            <span
              className={cn(
                "absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-200",
                isOpen ? "top-[0.4rem] rotate-45" : "top-2.5",
              )}
            />
          </div>
        </div>
        <span className="flex h-8 items-center text-lg leading-none font-medium">
          Menu
        </span>
      </Button>

      {/* Menu panel - fixed below header, using Portal to stay behind header z-index */}
      <Portal.Root>
        <div
          className={cn(
            "fixed inset-x-0 top-16 h-[calc(100svh-64px)] z-150 bg-background border-t border-border/40",
            "transition-all duration-300 ease-out",
            isOpen
              ? "translate-y-0 opacity-100 visible pointer-events-auto"
              : "-translate-y-4 opacity-0 invisible pointer-events-none",
          )}
          aria-hidden={!isOpen}
        >
          <div className="flex flex-col gap-8 h-full overflow-auto px-6 py-6 pb-12">
            {/* Menu Links */}
            <div className="flex flex-col gap-4">
              <div className="text-sm font-medium text-muted-foreground">
                Menu
              </div>
              <div className="flex flex-col gap-3">
                {links.map((link) => (
                  <MobileNavItem
                    key={link.name}
                    link={link}
                    isActive={checkActiveLink(link.href, pathname)}
                    onClick={() => onOpenChange(false)}
                  />
                ))}
              </div>
            </div>

            {/* Contact links */}
            {socialContacts.length > 0 && (
              <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-border/40">
                <div className="text-sm font-medium text-muted-foreground">
                  Liên hệ
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {socialContacts.map((contact) => (
                    <ContactLink
                      key={contact.id}
                      contact={contact}
                      showLabel={true}
                      showValue={false}
                      iconProps={{ size: 24, weight: "bold" }}
                      className="h-10 px-4 text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer hover:bg-muted border border-border/60 rounded-md"
                      iconClassName="size-4.5 flex items-center justify-center"
                      title={contact.label || contact.type}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Click-outside backdrop (transparent, below menu panel) */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
        )}
      </Portal.Root>
    </>
  );
}
