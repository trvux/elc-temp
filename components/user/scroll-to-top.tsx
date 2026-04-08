"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ScrollToTopProps {
  className?: string;
  children?: React.ReactNode;
}

export function ScrollToTop({ className, children }: ScrollToTopProps) {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <a
      href="#"
      onClick={handleScroll}
      className={cn("cursor-pointer", className)}
    >
      {children || "Trở lên đầu trang"}
    </a>
  );
}
