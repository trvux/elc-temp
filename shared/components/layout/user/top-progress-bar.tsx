"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useFilterTransition } from "@/shared/providers/filter-transition-provider";

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPending } = useFilterTransition();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(true);
    setProgress(10);
  };

  const completeProgress = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setProgress(100);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      timeoutRef.current = null;
    }, 300);
  };

  // Sync with isPending transition state
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isPending) {
      startProgress();
    } else {
      completeProgress();
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

      try {
        const url = new URL(href, window.location.origin);
        // Skip external origins
        if (url.origin !== window.location.origin) return;

        // Skip hash link changes on the same page
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash !== window.location.hash
        ) {
          return;
        }

        // Skip identical navigation
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }

      startProgress();
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, []);

  // Complete progress bar when pathname or searchParams change (navigation completes)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    completeProgress();
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
        transition: progress === 100
          ? "width 0.3s ease, opacity 0.3s ease"
          : (progress === 0 || progress === 10)
            ? "none"
            : "width 0.2s ease-out",
        opacity: progress === 100 ? 0 : 1,
        pointerEvents: "none",
      }}
    />
  );
}
