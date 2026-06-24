"use client";

import { NavigationMenu, NavigationMenuList } from "@/shared/components/ui/navigation-menu";
import { type NavLink, checkActiveLink } from "@/modules/settings/domain/navigation";
import { usePathname } from "next/navigation";
import { DesktopNavItem } from "./nav-item";

interface DesktopMenuProps {
  links: NavLink[];
}

export function DesktopMenu({ links }: DesktopMenuProps) {
  const pathname = usePathname();

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="flex items-center gap-0.5 lg:gap-1">
        {links.map((link) => (
          <DesktopNavItem
            key={link.name}
            link={link}
            isActive={checkActiveLink(link.href, pathname)}
          />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
