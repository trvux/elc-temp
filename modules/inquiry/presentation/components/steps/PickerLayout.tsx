"use client";

import { Skeleton } from "@/shared/components/ui/skeleton";

interface PickerLayoutProps {
  question: string;
  description?: string;
  loading?: boolean;
  skipLabel: string;
  onSkip: () => void;
  children: React.ReactNode;
  filters?: React.ReactNode;
}

// Shared chrome for every catalog-picker step (product/service-group/
// service/project-type) — question, optional filter chips, a result grid
// slot, a loading skeleton (no such pattern exists elsewhere in this repo —
// ProjectListModule just uses <Suspense fallback={null}>), and a "Skip"
// escape hatch so the visitor is never forced to browse the catalog.
export function PickerLayout({
  question,
  description,
  loading,
  skipLabel,
  onSkip,
  children,
  filters,
}: PickerLayoutProps) {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance">
        {question}
      </h1>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}

      {filters && <div className="mt-6">{filters}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          children
        )}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {skipLabel}
      </button>
    </div>
  );
}
