"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useFilterTransition } from "@/shared/providers/filter-transition-provider";

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPending } = useFilterTransition();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sync with isPending transition state
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isPending) {
      setVisible(true);
      setProgress(10);
    } else {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isPending]);

  // Handle normal link clicks
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external, blank, hash, or non-navigation links
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if it's the exact same URL (pathname + search) to avoid trigger on identical navigation
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      setVisible(true);
      setProgress((prev) => (prev > 0 ? prev : 10));
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, []);

  // Complete progress bar when pathname or searchParams change (navigation completes)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setProgress(100);
    const timer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(timer);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname, searchParams]);

  // Animate progress incrementally
  useEffect(() => {
    if (!visible || progress >= 90) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Slow down as it gets closer to 90%
        const increment = prev < 50 ? 10 : prev < 75 ? 5 : 2;
        return Math.min(90, prev + increment);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [visible, progress]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        width: `${progress}%`,
        backgroundColor: "var(--foreground, #000000)",
        zIndex: 99999,
        transition: progress === 100 ? "width 0.3s ease, opacity 0.3s ease" : "width 0.2s ease-out",
        opacity: progress === 100 ? 0 : 1,
        pointerEvents: "none",
      }}
    />
  );
}
