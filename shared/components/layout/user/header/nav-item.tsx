"use client";

import { type NavLink } from "@/modules/settings/domain/navigation";
import {
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
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
        active={isActive}
        className={navigationMenuTriggerStyle()}
      >
        <Link href={link.href}>{link.name}</Link>
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
        "flex items-center text-xl font-medium transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {link.name}
    </Link>
  );
};
