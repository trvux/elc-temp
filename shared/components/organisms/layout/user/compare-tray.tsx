"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { useCompare } from "@/shared/providers/compare-provider";
import { useProductFloating } from "@/shared/providers/product-floating-provider";

const SCROLL_REVEAL_THRESHOLD = 80;

// Docked at the bottom on desktop, same as ProductFloatingBar's "Mua ngay"
// reminder — but never both at once: `active` is true whenever
// ProductFloatingBar is mounted (i.e. on a product detail page), and there
// the buyer has already reached detail-page intent, so a "go compare" nudge
// doesn't apply anymore — the tray simply doesn't render there.
//
// On mobile, bottom-docked collides with StickyContactActions' fixed
// corner button (z-[100], bottom-2 right-4) — the tray sits right below
// the sticky header instead, and only reveals on scroll-up (rather than
// staying pinned once scrolled past the threshold like desktop) so it
// doesn't permanently eat into the small mobile viewport.
export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const { active: onProductDetailPage } = useProductFloating();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [scrollingUp, setScrollingUp] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > SCROLL_REVEAL_THRESHOLD);
      setScrollingUp(y < lastScrollY.current);
      lastScrollY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const canCompare = items.length >= 2;

  if (onProductDetailPage) return null;

  const visible = items.length > 0 && (isMobile ? scrolled && scrollingUp : scrolled);

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ y: isMobile ? "-100%" : "100%" }}
          animate={{ y: 0 }}
          exit={{ y: isMobile ? "-100%" : "100%" }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "fixed left-0 right-0 z-140 pointer-events-none px-3 md:px-6 lg:px-8",
            isMobile ? "top-20" : "bottom-4"
          )}
        >
          <div className="pointer-events-auto mx-auto max-w-2xl bg-background/95 backdrop-blur-md border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((item) => (
                <span
                  key={item.id}
                  className="flex items-center gap-1 shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                >
                  <span className="max-w-32 truncate">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={`Bỏ ${item.name} khỏi so sánh`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XIcon size={12} />
                  </button>
                </span>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Xóa
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canCompare}
              onClick={() => router.push(`/san-pham/so-sanh?ids=${items.map((i) => i.id).join(",")}`)}
            >
              So sánh ({items.length})
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
