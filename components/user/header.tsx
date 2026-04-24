"use client";

import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";

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

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const checkActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // --- STYLES ---
  const COMMON = {
    transition: "transition-all duration-300",
    navActive: "text-primary font-semibold",
    navInactive: "text-muted-foreground",
  };

  const styles = {
    wrapper: cn(
      "sticky top-0 z-50 w-full",
      COMMON.transition,
      isScrolled || isMenuOpen ? "bg-cream backdrop-blur-md" : "bg-transparent",
    ),
    container: "w-full max-w-7xl mx-auto relative",
    topBar: "flex h-20 items-center justify-between px-6",
    logo: "flex items-center font-semibold text-xl tracking-tighter",
    desktopNav: "hidden lg:flex",
    desktopAction: "hidden lg:flex items-center gap-4",
    mobileToggle: "flex lg:hidden items-center",
    iconBox: "relative flex h-5 w-5 items-center justify-center",
    icon: cn("absolute", COMMON.transition),
    mobileMenu: cn(
      "absolute inset-x-0 top-full -mt-px bg-cream lg:hidden border-b border-border rounded-2xl shadow-xl",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
      "duration-300",
    ),
    mobileNavWrapper: "flex flex-col px-6 pb-6 pt-2",
    overlay:
      "fixed inset-0 top-20 bg-black/10 backdrop-blur-sm lg:hidden transition-all duration-500",
    linkBase: (href: string) =>
      cn(
        COMMON.transition,
        checkActive(href) ? COMMON.navActive : COMMON.navInactive,
      ),
  };

  const NavItem = ({
    link,
    isMobile = false,
  }: {
    link: NavLink;
    isMobile?: boolean;
  }) => {
    const isActive = checkActive(link.href);

    if (isMobile) {
      return (
        <Link
          href={link.href}
          onClick={() => setIsMenuOpen(false)}
          className={cn(
            "py-3 text-lg transition-all duration-300",
            isActive ? COMMON.navActive : COMMON.navInactive,
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
            "bg-transparent! text-base hover:underline hover:underline-offset-4 hover:decoration-2",
            isActive ? COMMON.navActive : COMMON.navInactive,
            COMMON.transition,
          )}
        >
          <Link href={link.href}>{link.name}</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  };

  const IconState = ({ isOpen }: { isOpen: boolean }) => (
    <div className={styles.iconBox}>
      <Menu
        className={cn(
          styles.icon,
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <X
        className={cn(
          styles.icon,
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      />
    </div>
  );

  return (
    <div className={styles.wrapper}>
      {isMenuOpen && (
        <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />
      )}

      <header className={styles.container}>
        <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <div className={styles.topBar}>
            <Link href="/" className={styles.logo}>
              <Image 
                src="/logo/logo.svg" 
                alt="Điện máy ELC" 
                width={120} 
                height={40} 
                className="h-10 w-auto"
                priority
              />
            </Link>

            <NavigationMenu className={styles.desktopNav}>
              <NavigationMenuList className="flex items-center gap-1">
                {navLinks.map((link) => (
                  <NavItem key={link.name} link={link} />
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            <div className={styles.desktopAction}>
              <Button asChild variant="default">
                <Link href="/du-an">Khám phá</Link>
              </Button>
            </div>

            <div className={styles.mobileToggle}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-transparent!"
                  aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                >
                  <IconState isOpen={isMenuOpen} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent className={styles.mobileMenu}>
            <nav className={styles.mobileNavWrapper}>
              {navLinks.map((link, index) => (
                <React.Fragment key={link.name}>
                  <NavItem link={link} isMobile />
                  {index < navLinks.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </nav>
          </CollapsibleContent>
        </Collapsible>
      </header>
    </div>
  );
}
