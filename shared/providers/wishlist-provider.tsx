"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Heart } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface GoWishlistItem {
  id: string;
  product_id: string;
}

interface WishlistContextValue {
  ids: Set<string>;
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

const WishlistContext = createContext<WishlistContextValue>({
  ids: new Set(),
  isLoading: true,
  isWishlisted: () => false,
  toggle: async () => {},
  clearAll: async () => {},
  isDialogOpen: false,
  setDialogOpen: () => {},
});

// Small Context, no new state library — same shape as
// product-floating-provider.tsx. Fetches the visitor's wishlist once on
// mount (via the anonymous visitor_id cookie, see app/api/wishlist), then
// every WishlistButton across the app reads/toggles this single shared
// state instead of each doing its own fetch.
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (!res.ok) return;
        const data = (await res.json()) as { items?: GoWishlistItem[] };
        setIds(new Set((data.items ?? []).map((item) => item.product_id)));
      } catch {
        // Non-critical — an empty wishlist state is a safe fallback.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggle = useCallback(async (productId: string) => {
    const wasWishlisted = ids.has(productId);

    setIds((prev) => {
      const next = new Set(prev);
      if (wasWishlisted) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const res = wasWishlisted
        ? await fetch(`/api/wishlist/${productId}`, { method: "DELETE" })
        : await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: productId }),
          });

      if (!res.ok) throw new Error("wishlist toggle failed");

      // Real confirmation the user asked for — a silent icon-fill wasn't
      // enough feedback. toast.custom() so we control layout ourselves
      // (message on its own row, "Xem danh sách" as its own row below)
      // and the status color (green add / red remove) instead of fighting
      // sonner's built-in success/error semantics — "removed" isn't an
      // error. "Xem danh sách" opens WishlistDialog in place rather than
      // navigating to /yeu-thich, so browsing isn't interrupted.
      if (wasWishlisted) {
        toast.custom(() => (
          <WishlistToast tone="destructive" icon={<Heart />} message="Đã bỏ khỏi danh sách yêu thích" />
        ));
      } else {
        toast.custom((t) => (
          <WishlistToast
            tone="success"
            icon={<Heart weight="fill" className="text-destructive" />}
            message="Đã thêm vào danh sách yêu thích"
            action={{
              label: "Xem danh sách",
              onClick: () => {
                setDialogOpen(true);
                toast.dismiss(t);
              },
            }}
          />
        ));
      }
    } catch {
      // Revert the optimistic flip on failure.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
      toast.error("Không thể cập nhật yêu thích, vui lòng thử lại");
    }
  }, [ids]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  // No bulk-delete endpoint on the Go side (wishlist is DELETE /{productId}
  // only) — a wishlist realistically has a handful of items, so firing the
  // existing per-item DELETE in parallel is simpler than adding a backend
  // route for this. Items that fail to delete are restored so the user can
  // retry rather than silently losing track of them.
  const clearAll = useCallback(async () => {
    const snapshot = Array.from(ids);
    if (snapshot.length === 0) return;

    setIds(new Set());

    const results = await Promise.allSettled(
      snapshot.map((productId) => fetch(`/api/wishlist/${productId}`, { method: "DELETE" }))
    );
    const failed = snapshot.filter((_, i) => {
      const r = results[i];
      return r.status !== "fulfilled" || !r.value.ok;
    });

    if (failed.length > 0) {
      setIds(new Set(failed));
      toast.error(`Không thể xoá ${failed.length} sản phẩm, vui lòng thử lại`);
    } else {
      toast.custom(() => (
        <WishlistToast tone="destructive" icon={<Heart />} message="Đã xoá tất cả sản phẩm yêu thích" />
      ));
    }
  }, [ids]);

  return (
    <WishlistContext.Provider
      value={{ ids, isLoading, isWishlisted, toggle, clearAll, isDialogOpen, setDialogOpen }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}

// Row 1: icon + message. Row 2 (only on add): the "Xem danh sách" action,
// in its own flex row below the text rather than sonner's default
// same-line action button — reads clearer at the toast's narrow width.
function WishlistToast({
  tone,
  icon,
  message,
  action,
}: {
  tone: "success" | "destructive";
  icon: React.ReactNode;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border p-4 shadow-lg",
        tone === "success"
          ? "border-green-600/30 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-950/40 dark:text-green-300"
          : "border-red-600/30 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300"
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {message}
      </div>
      {action && (
        <div className="flex">
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
