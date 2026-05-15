"use client";

import * as React from "react";

export function useHeader() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const handleMenuToggle = (open: boolean) => {
    setIsMenuOpen(open);
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return {
    isMenuOpen,
    setIsMenuOpen,
    isScrolled,
    handleMenuToggle,
  };
}
