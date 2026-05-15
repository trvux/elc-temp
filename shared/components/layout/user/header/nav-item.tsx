"use client";

import { type NavLink } from "@/modules/settings/domain/navigation";
import {
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/shared/components/ui/navigation-menu";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";

interface NavItemProps {
  link: NavLink;
  isActive: boolean;
  onClick?: () => void;
}

export const DesktopNavItem = ({ link, isActive }: NavItemProps) => {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink
        asChild
        className={cn(
          "bg-transparent px-2 lg:px-4 py-4 text-sm lg:text-sm font-medium transition-colors duration-200 whitespace-nowrap",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Link
          href={link.href}
          className="relative flex items-center h-full group/item"
        >
          <span className="relative py-1">
            {link.name}
            <span
              className={cn(
                "absolute -bottom-0.5 left-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-in-out",
                isActive
                  ? "w-full opacity-100"
                  : "w-0 opacity-0 group-hover/item:w-full group-hover/item:opacity-100",
              )}
            />
          </span>
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

export const MobileNavItem = ({ link, isActive, onClick }: NavItemProps) => {
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "flex items-center w-full py-4 px-6 text-lg transition-colors",
        isActive
          ? "text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {link.name}
    </Link>
  );
};
