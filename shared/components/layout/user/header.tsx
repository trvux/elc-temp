"use client";

import { cn } from "@/shared/lib/utils";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

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
  navigationMenuTriggerStyle,
} from "@/shared/components/ui/navigation-menu";

interface NavLink {
  name: string;
  href: string;
}

const navLinks: NavLink[] = [
  { name: "Trang chủ", href: "/" },
  { name: "Dự án", href: "/du-an" },
  { name: "Sản phẩm", href: "/san-pham" },
  { name: "Dịch vụ", href: "/dich-vu" },
  { name: "Chi nhánh", href: "/chi-nhanh" },
  { name: "Tin tức", href: "/tin-tuc" },
  { name: "Thông tin", href: "/thong-tin" },
];

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
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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
          navigationMenuTriggerStyle(),
          "bg-transparent! h-10 px-4 text-sm font-medium transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Link href={link.href} className="relative flex items-center h-full group/item">
          <span className="relative py-1">
            {link.name}
            <span 
              className={cn(
                "absolute -bottom-0.5 left-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-in-out",
                isActive 
                  ? "w-full opacity-100" 
                  : "w-0 opacity-0 group-hover/item:w-full group-hover/item:opacity-100"
              )} 
            />
          </span>
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const IconState = ({ isOpen }: { isOpen: boolean }) => (
  <div className="relative h-5 w-5">
    <Menu
      className={cn(
        "absolute inset-0 h-5 w-5 transition-all duration-300",
        isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
      )}
    />
    <X
      className={cn(
        "absolute inset-0 h-5 w-5 transition-all duration-300",
        isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
      )}
    />
  </div>
);

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const checkActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Spacer giúp Header chiếm diện tích trong layout để không bị đè nội dung */}
      <div className="h-20 lg:h-24 shrink-0" aria-hidden="true" />

      <div 
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl px-0",
          COMMON.transition
        )}
      >
        {isMenuOpen && (
          <div 
            className="fixed inset-0 -top-4 -left-1/2 translate-x-1/2 w-screen h-screen bg-background/10 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        <header 
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border bg-background/70 backdrop-blur-xl shadow-sm transition-all duration-300",
            isScrolled && "shadow-lg bg-background/90",
            isMenuOpen && "rounded-b-none border-b-transparent bg-background"
          )}
        >
          <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <Link href="/" className="flex items-center shrink-0 transition-opacity hover:opacity-80">
                <Image
                  src="/logo/logo.svg"
                  alt="Điện máy ELC"
                  width={110}
                  height={36}
                  className="h-9 w-auto"
                  style={{ width: "auto" }}
                  priority
                />
              </Link>

              <NavigationMenu className="hidden lg:flex">
                <NavigationMenuList className="flex items-center gap-1">
                  {navLinks.map((link) => (
                    <NavItem
                      key={link.name}
                      link={link}
                      isActive={checkActive(link.href)}
                    />
                  ))}
                </NavigationMenuList>
              </NavigationMenu>

              <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden sm:flex">
                  <Button asChild variant="default" size="sm" className="rounded-full px-6 font-medium">
                    <Link href="/du-an">Khám phá</Link>
                  </Button>
                </div>

                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden rounded-full hover:bg-accent"
                    aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                  >
                    <IconState isOpen={isMenuOpen} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            <CollapsibleContent className="lg:hidden overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-300">
              <div className="border-t border-border bg-background/50 p-4 space-y-1">
                {navLinks.map((link) => (
                  <NavItem
                    key={link.name}
                    link={link}
                    isActive={checkActive(link.href)}
                    isMobile
                    onClick={() => setIsMenuOpen(false)}
                  />
                ))}
                <div className="pt-4 sm:hidden">
                  <Button asChild className="w-full rounded-xl font-medium">
                    <Link href="/du-an" onClick={() => setIsMenuOpen(false)}>Khám phá</Link>
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
