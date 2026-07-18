"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { useCompare } from "@/shared/providers/compare-provider";
import { useProductFloating } from "@/shared/providers/product-floating-provider";

const SCROLL_REVEAL_THRESHOLD = 80;

// Docked at the bottom, same as ProductFloatingBar's "Mua ngay" reminder —
// but never both at once: `active` is true whenever ProductFloatingBar is
// mounted (i.e. on a product detail page), and there the buyer has already
// reached detail-page intent, so a "go compare" nudge doesn't apply anymore
// — the tray simply doesn't render there. Elsewhere (listing pages) it only
// reveals once the user scrolls down a bit, not immediately on page load.
export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const { active: onProductDetailPage } = useProductFloating();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_REVEAL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const canCompare = items.length >= 2;

  if (onProductDetailPage) return null;

  return (
    <AnimatePresence>
      {items.length > 0 && scrolled && (
        <m.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-4 left-0 right-0 z-140 pointer-events-none px-3 md:px-6 lg:px-8"
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
