"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { useCompare } from "@/shared/providers/compare-provider";

// Persistent bottom-docked tray, visible site-wide whenever ≥1 product is
// queued for comparison — same visual language (fixed, rounded, blurred
// background) as ProductFloatingBar, but global rather than
// sentinel-triggered per product page.
export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const router = useRouter();

  const canCompare = items.length >= 2;

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <m.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-4 left-0 right-0 z-110 pointer-events-none px-3 md:px-6 lg:px-8"
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
