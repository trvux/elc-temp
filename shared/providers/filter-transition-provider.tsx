"use client";

import { createContext, useContext, useTransition } from "react";

interface FilterTransitionContextProps {
  isPending: boolean;
  startTransition: (callback: () => void) => void;
}

const FilterTransitionContext = createContext<FilterTransitionContextProps>({
  isPending: false,
  startTransition: (cb) => cb(),
});

export function FilterTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();

  return (
    <FilterTransitionContext.Provider value={{ isPending, startTransition }}>
      {children}
    </FilterTransitionContext.Provider>
  );
}

export function useFilterTransition(): FilterTransitionContextProps {
  return useContext(FilterTransitionContext);
}
