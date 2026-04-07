"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Trang chủ", href: "/" },
    { name: "Công trình", href: "/cong-trinh" },
    { name: "Sản phẩm", href: "/san-pham" },
    { name: "Chi nhánh", href: "/chi-nhanh" },
    { name: "Thông tin", href: "/thong-tin" },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out px-4",
          isScrolled ? "py-2" : "py-4",
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-7xl flex items-center justify-between rounded-xl px-container py-2.5 transition-all duration-500 ease-in-out",
            isScrolled && !isMenuOpen
              ? "border border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl scale-95"
              : "bg-transparent border-transparent shadow-none scale-100",
          )}
        >
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start">
            <Link
              href="/"
              className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 group"
            >
              <div className=" p-1.5 rounded-lg transition-transform group-hover:rotate-6">
                <span className="text-xl font-black italic tracking-tighter text-primary uppercase">
                  ELC
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden items-center md:flex px-2 lg:px-6">
            {navLinks.map((link) => {
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "group relative px-3 lg:px-6 py-2 text-xs lg:text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.name}
                  <span className={cn(
                    "absolute bottom-1.5 left-2 right-2 lg:left-4 lg:right-4 h-0.5 bg-primary/80 transition-transform duration-300",
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )} />
                </Link>
              );
            })}
          </nav>

          {/* Right: CTA Button */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <Button
              asChild
              variant="default"
              size="sm"
              className="hidden md:inline-flex rounded-lg px-3 lg:px-5 py-4 text-xs lg:text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-primary/10"
            >
              <Link href="/cong-trinh">
                Khám phá ngay
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:hidden"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/85 transition-opacity duration-500 md:hidden",
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 origin-top transform transition-all duration-500 ease-in-out md:hidden",
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="bg-background/95 backdrop-blur-3xl px-10 py-10 rounded-b-[3rem] shadow-xl border-b border-border">
          <nav className="flex flex-col items-center justify-center gap-8">
            {navLinks.map((link) => {
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "text-2xl tracking-tight transition-all active:scale-95",
                    isActive
                      ? "font-black text-primary"
                      : "font-bold text-foreground hover:text-primary",
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
