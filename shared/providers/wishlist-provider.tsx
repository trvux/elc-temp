"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface GoWishlistItem {
  id: string;
  product_id: string;
}

interface WishlistContextValue {
  ids: Set<string>;
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue>({
  ids: new Set(),
  isLoading: true,
  isWishlisted: () => false,
  toggle: async () => {},
});

// Small Context, no new state library — same shape as
// product-floating-provider.tsx. Fetches the visitor's wishlist once on
// mount (via the anonymous visitor_id cookie, see app/api/wishlist), then
// every WishlistButton across the app reads/toggles this single shared
// state instead of each doing its own fetch.
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
      // enough feedback, and there was previously no way to discover
      // /yeu-thich at all (not linked anywhere in the header).
      if (wasWishlisted) {
        toast("Đã bỏ khỏi danh sách yêu thích");
      } else {
        toast.success("Đã thêm vào danh sách yêu thích", {
          action: { label: "Xem danh sách", onClick: () => router.push("/yeu-thich") },
        });
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
  }, [ids, router]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  return (
    <WishlistContext.Provider value={{ ids, isLoading, isWishlisted, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
