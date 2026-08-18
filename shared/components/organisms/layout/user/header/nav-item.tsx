"use client";

import { type NavLink } from "@/modules/settings/domain/navigation";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";

interface NavItemProps {
  link: NavLink;
  isActive: boolean;
  onClick?: () => void;
}

export const DesktopNavItem = ({ link, isActive }: NavItemProps) => {
  return (
    <Link
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "text-sm font-medium transition-colors",
        isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground",
      )}
    >
      {link.name}
    </Link>
  );
};

export const MobileNavItem = ({ link, onClick }: NavItemProps) => {
  return (
    <Link
      href={link.href}
      onClick={(e) => {
        e.currentTarget.blur();
        onClick?.();
      }}
      className={cn(
        "flex items-center rounded-lg px-3 py-3 text-2xl font-semibold text-foreground no-underline! transition-colors",
      )}
    >
      {link.name}
    </Link>
  );
};
