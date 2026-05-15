"use client";

import {
  type NavLink,
  checkActiveLink,
} from "@/modules/settings/domain/navigation";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";
import { ListIcon, XIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { MobileNavItem } from "./nav-item";

interface MobileMenuProps {
  links: NavLink[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ links, isOpen, onOpenChange }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <Sheet modal={false} open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex lg:hidden items-center justify-center p-0 relative z-50 bg-transparent hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-transparent"
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
        >
          <div className="relative size-6">
            <ListIcon
              className={cn(
                "absolute inset-0 size-6 transition-all duration-300",
                isOpen
                  ? "rotate-90 scale-0 opacity-0"
                  : "rotate-0 scale-100 opacity-100",
              )}
            />
            <XIcon
              className={cn(
                "absolute inset-0 size-6 transition-all duration-300",
                isOpen
                  ? "rotate-0 scale-100 opacity-100"
                  : "-rotate-90 scale-0 opacity-0",
              )}
            />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="min-h-screen mt-16"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Menu điều hướng</SheetTitle>
          <SheetDescription>
            Truy cập các trang chính của Điện máy ELC
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto flex flex-col pt-4">
          <nav className="flex flex-col">
            {links.map((link) => (
              <MobileNavItem
                key={link.name}
                link={link}
                isActive={checkActiveLink(link.href, pathname)}
                onClick={() => onOpenChange(false)}
              />
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
