"use client";

import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
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

  // --- CONSTANT CLASSES ---
  const wrapperClass = cn(
    "sticky top-0 z-50 w-full transition-all duration-300",
    isScrolled || isMenuOpen ? "bg-cream backdrop-blur-md" : "bg-transparent",
    // isScrolled && !isMenuOpen,
  );

  const containerClass = "w-full max-w-7xl mx-auto relative";
  const topBarClass = "flex h-20 items-center justify-between px-6";
  const logoClass = "flex items-center font-semibold text-xl tracking-tighter";

  const desktopNavClass = "hidden lg:flex";
  const desktopActionClass = "hidden lg:flex items-center gap-4";

  const mobileToggleClass = "flex lg:hidden items-center";
  const iconBoxClass = "relative flex h-5 w-5 items-center justify-center";

  // Sửa lỗi lệch màu: dính chặt vào header bằng top-[calc(100%-1px)]
  const mobileMenuContentClass = cn(
    "absolute top-[calc(100%-1px)] left-0 w-full bg-cream lg:hidden border-b border-border rounded-2xl shadow-xl",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-300",
  );

  const mobileNavWrapperClass = "flex flex-col px-6 pb-6 pt-2";
  const overlayClass =
    "fixed inset-0 top-20 bg-black/10 backdrop-blur-[2px] lg:hidden transition-all duration-500";

  // Reusable Link Style
  const getLinkClass = (href: string, isMobile = false) =>
    cn(
      "transition-all duration-300",
      isMobile
        ? "text-xl font-medium tracking-tight"
        : "bg-transparent hover:bg-transparent",
      checkActive(href)
        ? "text-primary font-semibold"
        : "text-muted-foreground",
    );

  return (
    <div className={wrapperClass}>
      {/* Backdrop Overlay khi mở Menu */}
      {isMenuOpen && (
        <div className={overlayClass} onClick={() => setIsMenuOpen(false)} />
      )}

      <header className={containerClass}>
        <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <div className={topBarClass}>
            {/* Logo */}
            <Link href="/" className={logoClass}>
              ELC
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className={desktopNavClass}>
              <NavigationMenuList className="flex items-center gap-1">
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.name}>
                    <NavigationMenuLink
                      asChild
                      className={cn(
                        navigationMenuTriggerStyle(),
                        // Triệt tiêu focus background mặc định của Shadcn
                        "focus:bg-transparent focus:text-accent-foreground",
                        "data-active:bg-transparent data-[state=open]:bg-transparent",
                        // Giữ lại logic của mày
                        "bg-transparent text-md hover:bg-transparent hover:underline hover:underline-offset-4 hover:decoration-2",
                        checkActive(link.href) && "text-primary font-semibold",
                      )}
                    >
                      <Link href={link.href}>{link.name}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Desktop Actions */}
            <div className={desktopActionClass}>
              <Button asChild variant="default">
                <Link href="/du-an">Khám phá</Link>
              </Button>
            </div>

            {/* Mobile Toggle */}
            <div className={mobileToggleClass}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent data-[state=open]:bg-transparent"
                  aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                >
                  <div className={iconBoxClass}>
                    <Menu
                      className={cn(
                        "absolute transition-all duration-300",
                        isMenuOpen
                          ? "scale-0 opacity-0"
                          : "scale-100 opacity-100",
                      )}
                    />
                    <X
                      className={cn(
                        " absolute transition-all duration-300",
                        isMenuOpen
                          ? " scale-100 opacity-100"
                          : " scale-0 opacity-0",
                      )}
                    />
                  </div>
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Mobile Menu Content */}
          <CollapsibleContent className={mobileMenuContentClass}>
            <nav className={mobileNavWrapperClass}>
              {navLinks.map((link, index) => (
                <React.Fragment key={link.name}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "py-3 text-lg font-bold transition-colors", // Dùng py-3 để tạo khoảng trống quanh link
                      checkActive(link.href)
                        ? "text-primary font-bold"
                        : "text-muted-foreground",
                    )}
                  >
                    {link.name}
                  </Link>
                  {/* Thêm separator giữa các link, trừ link cuối cùng */}
                  {index < navLinks.length - 1 && <Separator />}
                </React.Fragment>
              ))}
              {/* <Button asChild className="w-full">
                <Link href="/du-an" onClick={() => setIsMenuOpen(false)}>
                  Xem dự án
                </Link>
              </Button> */}
            </nav>
          </CollapsibleContent>
        </Collapsible>
      </header>
    </div>
  );
}
