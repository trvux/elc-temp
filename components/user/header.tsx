"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
  { name: "Trang chủ", href: "/" },
  { name: "Dự án", href: "/du-an" },
  //   { name: "Sản phẩm", href: "/san-pham" },
  { name: "Liên hệ", href: "/lien-he" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
              className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <span className="text-xl font-bold italic tracking-tight text-primary">
                ELC
              </span>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden items-center md:flex px-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group relative px-6 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                {item.name}
                <span className="absolute bottom-1.5 left-4 right-4 h-0.5 bg-primary/80 scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          {/* Right: CTA Button */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <Button
              variant="default"
              size="sm"
              className="hidden rounded-lg px-4 py-4 font-semibold md:inline-flex"
            >
              Bắt đầu ngay
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg md:hidden"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown Overlay (Backdrop) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/85 transition-opacity duration-500 md:hidden",
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Dropdown */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 origin-top transform transition-all duration-500 ease-in-out md:hidden",
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="bg-background/95 backdrop-blur-3xl px-10 py-10 rounded-b-3xl shadow-xl border-b border-border">
          <nav className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-semibold tracking-tight text-muted-foreground transition-all duration-300 hover:text-primary active:scale-95"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
