"use client";

import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/shared/lib/utils";

interface StarRatingProps {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-6",
};

// Read-only star display — rounds to the nearest half star (a comment's
// exact rating is always a whole 1-5 int, but an aggregate average like 4.3
// isn't, so this reads naturally for both).
export function StarRating({ value, size = "md", className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i - 0.25;
        return (
          <Star
            key={i}
            weight={filled ? "fill" : "regular"}
            className={cn(SIZE_CLASS[size], filled ? "text-amber-400" : "text-muted-foreground/30")}
          />
        );
      })}
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Tuyệt vời",
};

// Interactive 1-5 star picker for the review submission form — whole stars
// only (no half-star input). Hover/tap animates each star and a live label
// underneath ("Tốt", "Tuyệt vời"...) makes the rating feel less like a bare
// form control.
export function StarRatingInput({ value, onChange, className }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const displayed = hovered || value;

  return (
    <div className={cn("flex flex-col items-center gap-2 py-2", className)}>
      <div
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <m.button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHovered(i)}
            aria-label={`${i} sao`}
            aria-pressed={value === i}
            className="p-1"
            animate={{ scale: displayed >= i ? 1.15 : 1, y: displayed >= i ? -2 : 0 }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Star
              weight={displayed >= i ? "fill" : "regular"}
              className={cn(
                "size-9 transition-colors",
                displayed >= i ? "text-amber-400" : "text-muted-foreground/30"
              )}
            />
          </m.button>
        ))}
      </div>
      <div className="h-5">
        <AnimatePresence mode="wait">
          {displayed > 0 && (
            <m.span
              key={displayed}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-medium text-amber-500"
            >
              {RATING_LABELS[displayed]}
            </m.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
