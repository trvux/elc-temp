"use client";

import { Star } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}

// Read-only when onChange is omitted (review list/summary display);
// interactive click-to-set when provided (submit form).
export function StarRating({ value, onChange, size = 18, className }: StarRatingProps) {
  const interactive = !!onChange;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={cn("flex items-center gap-0.5", className)} role={interactive ? "radiogroup" : undefined}>
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={cn(
              "leading-none",
              interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default",
            )}
            aria-label={`${star} sao`}
          >
            <Star
              size={size}
              weight={filled ? "fill" : "regular"}
              className={filled ? "text-amber-500" : "text-muted-foreground/40"}
            />
          </button>
        );
      })}
    </div>
  );
}
