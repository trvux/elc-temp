"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ProductFloatingContext = createContext<{
  active: boolean;
  setActive: (v: boolean) => void;
}>({ active: false, setActive: () => {} });

export function ProductFloatingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);
  const set = useCallback((v: boolean) => setActive(v), []);
  return (
    <ProductFloatingContext.Provider value={{ active, setActive: set }}>
      {children}
    </ProductFloatingContext.Provider>
  );
}

export function useProductFloating() {
  return useContext(ProductFloatingContext);
}
