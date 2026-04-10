"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavLink {
  name: string;
  href: string;
}

const navLinks: NavLink[] = [
  { name: "Trang chủ", href: "/" },
  { name: "Công trình", href: "/cong-trinh" },
  { name: "Sản phẩm", href: "/san-pham" },
  { name: "Chi nhánh", href: "/chi-nhanh" },
  { name: "Thông tin", href: "/thong-tin" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <div className="w-full fixed top-0 left-0 right-0 z-50">
      {/* Main Header Container */}
      <header className="px-4 py-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <Collapsible
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            className={cn(
              "relative flex flex-col bg-cream/80 backdrop-blur-xl rounded-2xl border border-border transition-all duration-500 shadow-md",
              isMenuOpen && "rounded-2xl",
            )}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-3">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <span className="text-2xl font-bold tracking-tight text-black">
                  ELC
                </span>
              </Link>

              {/* Desktop Navigation */}
              <NavigationMenu className="hidden lg:flex px-8">
                <NavigationMenuList className="gap-2">
                  {navLinks.map((link) => {
                    const isActive =
                      link.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(link.href);
                    return (
                      <NavigationMenuItem key={link.name}>
                        <NavigationMenuLink
                          asChild
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent text-sm transition-colors h-9 px-4 hover:text-black hover:underline underline-offset-4",
                            isActive
                              ? "font-semibold text-black"
                              : "font-medium text-black/80",
                          )}
                        >
                          <Link href={link.href}>{link.name}</Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>

              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="h-6 w-px bg-border mr-2 opacity-50" />
                <Button
                  asChild
                  className={cn(
                    "rounded-xl border-border px-5 h-10 text-sm font-semibold",
                    pathname === "/cong-trinh" && "border-2 border-black",
                  )}
                >
                  <Link href="/cong-trinh">Khám phá</Link>
                </Button>
              </div>

              {/* Mobile Toggle */}
              <div className="flex lg:hidden items-center">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                    className="p-1 rounded-lg text-black relative w-10 h-10 overflow-hidden"
                  >
                    <div className="relative w-6 h-6 flex items-center justify-center">
                      <Menu
                        className={cn(
                          "absolute transition-all duration-500 ease-in-out",
                          isMenuOpen
                            ? "opacity-0 rotate-90 scale-50"
                            : "opacity-100 rotate-0 scale-100",
                        )}
                        size={20}
                      />
                      <X
                        className={cn(
                          "absolute transition-all duration-500 ease-in-out",
                          isMenuOpen
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 -rotate-90 scale-50",
                        )}
                        size={20}
                      />
                    </div>
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* Mobile Menu Content */}
            <CollapsibleContent className="CollapsibleContent overflow-hidden transition-all duration-500 ease-in-out">
              <div className="flex flex-col px-6 py-2 border-t border-border">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between py-4 text-base transition-colors border-b border-border/50 last:border-b-0 hover:bg-transparent hover:underline underline-offset-4",
                        isActive
                          ? "font-bold text-black"
                          : "font-semibold text-black/80",
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}
                <div className="py-4 last:border-b-0">
                  <Link
                    href="/cong-trinh"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "text-base transition-colors lg:bg-primary lg:text-foreground-primary underline-offset-4",
                      pathname === "/cong-trinh"
                        ? "font-bold text-black"
                        : "font-semibold text-black/80",
                    )}
                  >
                    Xem công trình
                  </Link>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </header>
    </div>
  );
}
