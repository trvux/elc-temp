"use client";

import { useFilterTransition } from "@/shared/providers/filter-transition-provider";
import { cn } from "@/shared/lib/utils";

interface FilteredGridWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  className?: string;
}

export function FilteredGridWrapper({
  children,
  fallback,
  className,
}: FilteredGridWrapperProps) {
  const { isPending } = useFilterTransition();

  return (
    <div className={cn("relative w-full", className)}>
      {isPending ? (
        <div className="w-full">{fallback}</div>
      ) : (
        children
      )}
    </div>
  );
}
