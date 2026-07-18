"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "compare-products";
const MAX_ITEMS = 4;

export interface CompareItem {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

interface CompareContextValue {
  items: CompareItem[];
  isSelected: (productId: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue>({
  items: [],
  isSelected: () => false,
  toggle: () => {},
  remove: () => {},
  clear: () => {},
});

function read(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(items: CompareItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

// Comparison selection is ephemeral browsing state (unlike Wishlist, which
// is account-like and persisted server-side) — sessionStorage, not the API.
// Locked to a single category: the Go API rejects a cross-category compare
// request, but the real UX guard belongs here, before ever hitting it. The
// per-card compare control (ProductCard's icon button) is always visible;
// CompareLinkButton next to the listing H1 is just a shortcut into the
// comparison page for whatever's already queued here.
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  // Initial read deferred to an effect (not a lazy useState initializer) so
  // the client's first render matches the server-rendered empty state,
  // avoiding a hydration mismatch — same reasoning as the old
  // use-recently-viewed.ts localStorage read.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(read());
  }, []);

  const isSelected = useCallback(
    (productId: string) => items.some((i) => i.id === productId),
    [items],
  );

  const toggle = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        const next = prev.filter((i) => i.id !== item.id);
        write(next);
        return next;
      }

      if (prev.length > 0 && prev[0].categoryId !== item.categoryId) {
        toast.error("Chỉ có thể so sánh sản phẩm cùng danh mục");
        return prev;
      }

      if (prev.length >= MAX_ITEMS) {
        toast.error(`Chỉ có thể so sánh tối đa ${MAX_ITEMS} sản phẩm`);
        return prev;
      }

      const next = [...prev, item];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== productId);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  return (
    <CompareContext.Provider value={{ items, isSelected, toggle, remove, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
