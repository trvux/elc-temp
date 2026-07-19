"use client";

import { useCallback, useEffect, useState } from "react";

// Backed by the real /recently-viewed API (anonymous visitor_id cookie,
// server-side, see app/api/recently-viewed/route.ts) — no longer
// localStorage. The API only exposes GET (list, newest-first, capped at 20)
// and POST (record a view, upserts) — no per-item delete, no clear-all — so
// unlike the old localStorage version, this hook has no removeProduct/
// clearAll: the list is read-only, naturally aging out of the top-20 by
// viewed_at, matching most real e-commerce sites.
export interface RecentlyViewedProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  displayPrice: number | null;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/recently-viewed");
      if (!res.ok) return;
      const data = (await res.json()) as { items?: RecentlyViewedProduct[] };
      setItems(data.items ?? []);
    } catch {
      // Non-critical enhancement — a failed fetch just means an empty list.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-read on back navigation (page becomes visible again) — same reasoning
  // as the old localStorage version, still valid: the list may have changed
  // (viewed a product on another tab) since this component mounted.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const trackView = useCallback(async (productId: string) => {
    try {
      await fetch("/api/recently-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
    } catch {
      // Fire-and-forget — a dropped tracking call shouldn't affect the page.
    }
  }, []);

  return { items, isLoading, trackView, refresh };
}
