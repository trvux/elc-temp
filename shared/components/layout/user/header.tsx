"use client";

import { cn } from "@/shared/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  checkActiveLink,
  navLinks,
  type NavLink,
} from "@/modules/settings/domain/navigation";
import { Button } from "@/shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/shared/components/ui/navigation-menu";

const COMMON = {
  transition: "transition-all duration-300 ease-in-out",
};

const NavItem = ({
  link,
  isActive,
  isMobile = false,
  onClick,
}: {
  link: NavLink;
  isActive: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}) => {
  if (isMobile) {
    return (
      <Link
        href={link.href}
        onClick={onClick}
        className={cn(
          "flex items-center w-full py-3 px-4 rounded-xl transition-colors",
          isActive
            ? "bg-primary/5 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
      >
        {link.name}
      </Link>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuLink
        asChild
        className={cn(
          "bg-transparent px-4 py-2 text-sm font-medium transition-colors duration-200",
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

const IconState = ({ isOpen }: { isOpen: boolean }) => (
  <div className="grid size-5 place-items-center">
    <Menu
      className={cn(
        "col-start-1 row-start-1 size-5 transition-all duration-300",
        isOpen
          ? "rotate-90 scale-0 opacity-0"
          : "rotate-0 scale-100 opacity-100",
      )}
    />
    <X
      className={cn(
        "col-start-1 row-start-1 size-5 transition-all duration-300",
        isOpen
          ? "rotate-0 scale-100 opacity-100"
          : "-rotate-90 scale-0 opacity-0",
      )}
    />
  </div>
);

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const pathname = usePathname();

  // Xử lý khi đóng/mở menu để tránh ghosting
  const handleMenuToggle = (open: boolean) => {
    setIsMenuOpen(open);
    setIsTransitioning(true);
    // Timeout khớp với duration 1000ms của transition mới
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Spacer giúp Header chiếm diện tích trong layout để không bị đè nội dung */}
      <div className="h-20 lg:h-24 shrink-0" aria-hidden="true" />

      {/* Overlay blur toàn màn hình khi mở menu mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-muted-foreground/80 lg:hidden transition-all duration-1000 ease-[cubic-bezier(0.64,0,0.78,0)]",
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      <div
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl px-0",
          COMMON.transition,
        )}
      >
        <header
          className={cn(
            "relative overflow-hidden rounded-xl border border-border transition-all duration-300",
            // Giữ màu đặc (opaque) khi đang mở hoặc đang trong quá trình đóng/mở (transition)
            isMenuOpen || isTransitioning
              ? "bg-background border-b-transparent shadow-lg"
              : isScrolled
                ? "bg-background/80 backdrop-blur-md shadow-md"
                : "bg-background/40 backdrop-blur-sm shadow-sm",
          )}
        >
          <Collapsible open={isMenuOpen} onOpenChange={handleMenuToggle}>
            <div className="flex h-14 md:h-16 items-center justify-between px-6 md:px-9">
              <Link
                href="/"
                className="flex items-center shrink-0 transition-opacity hover:opacity-80"
              >
                <img
                  src="/logo/logo.svg"
                  alt="Điện máy ELC"
                  className="h-9 w-auto"
                />
              </Link>

              <NavigationMenu className="hidden lg:flex">
                <NavigationMenuList className="flex items-center gap-1">
                  {navLinks.map((link) => (
                    <NavItem
                      key={link.name}
                      link={link}
                      isActive={checkActiveLink(link.href, pathname)}
                    />
                  ))}
                </NavigationMenuList>
              </NavigationMenu>

              <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden lg:flex">
                  <Button asChild variant="default" size="lg">
                    <Link href="/du-an">Khám phá</Link>
                  </Button>
                </div>

                <CollapsibleTrigger asChild>
                  <Button
                    variant="link"
                    size="lg"
                    className="flex lg:hidden  items-center justify-center"
                    aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                  >
                    <IconState isOpen={isMenuOpen} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            <CollapsibleContent className="lg:hidden overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="border-t border-border mx-4 md:mx-6" />
              <div className="flex flex-col gap-1 px-4 py-6 md:px-6">
                {navLinks.map((link) => (
                  <NavItem
                    key={link.name}
                    link={link}
                    isActive={checkActiveLink(link.href, pathname)}
                    isMobile
                    onClick={() => setIsMenuOpen(false)}
                  />
                ))}
                <div className="pt-4 lg:hidden">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/du-an" onClick={() => setIsMenuOpen(false)}>
                      Khám phá
                    </Link>
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </header>
      </div>
    </>
  );
}
