"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "recently-viewed-products";
const MAX_ITEMS = 10;

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  salePrice: number;
  originalPrice: number;
  stockStatus: string | null;
  viewedAt: number;
}

function read(): RecentlyViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(items: RecentlyViewedProduct[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);

  // Initial read after hydration — deliberately deferred to an effect
  // (not a useState lazy initializer) so the client's first render matches
  // the server-rendered empty state, avoiding a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(read());
  }, []);

  // Re-read on back navigation (page becomes visible again)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setItems(read());
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const addProduct = (product: Omit<RecentlyViewedProduct, "viewedAt">) => {
    const current = read();
    const filtered = current.filter((p) => p.id !== product.id);
    const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(
      0,
      MAX_ITEMS,
    );
    write(updated);
    setItems(updated);
  };

  const removeProduct = (id: string) => {
    const updated = items.filter((p) => p.id !== id);
    write(updated);
    setItems(updated);
  };

  const clearAll = () => {
    write([]);
    setItems([]);
  };

  return { items, addProduct, removeProduct, clearAll };
}
