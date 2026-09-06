"use client";

import { ArrowRight } from "@phosphor-icons/react";
import type { ComponentType } from "react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

import { DragRotate3DCard } from "./DragRotate3DCard";
import type { MODEL_BUILDERS } from "./three-models.js";

type ModelKey = keyof typeof MODEL_BUILDERS;

interface EntityPickerCardProps {
  // Exactly one of these two should be passed — modelKey renders the
  // drag-to-rotate 3D card (see DragRotate3DCard.tsx /
  // docs/interactive-3d-icon-pattern.md), icon renders the older flat
  // gradient-badge illustration (entity-icons.tsx). Steps convert from one
  // to the other individually, not all at once — see the doc's "What's
  // still open" section for which steps have and haven't converted yet.
  icon?: ComponentType<{ className?: string }>;
  modelKey?: ModelKey;
  title: string;
  selected?: boolean;
  onClick: () => void;
}

// Bare presentational selection card for the lead form's catalog pickers —
// deliberately not ProductCard/CardService, which are wired to
// WishlistButton/CompareToggleButton/Zalo CTA and cart/wishlist/compare
// providers the chromeless (fullscreen) route group doesn't mount.
//
// Structure (explicit user spec):
//   wrapper — translucent bg-muted/10 frame, border, padding (the
//   original nested-card treatment, same as LinkPreviewCard's CardShell:
//   an outer translucent frame with a solid bg-background card floating
//   on top of it)
//   -> card con (aspect-[4/3] landscape — this level carries the ratio,
//      not the wrapper)
//        -> 3D model/icon (top, flex-1 — fills whatever's left)
//        -> title (bottom, fixed compact row)
//   -> button (below card con, still inside the wrapper's padded frame)
//
// The 4:3 ratio living on card con (not just the model sub-region) is
// deliberate: an earlier pass made only the model 4:3 and stacked the
// title below it, which left card con as a whole taller than 4:3 (any
// non-zero text height added under an already-4:3 image can only push the
// total past 4:3, never keep it) — so the model region here flex-shrinks
// to share the fixed-ratio box with the title instead of owning its own
// separate 4:3 slice. See docs/interactive-3d-icon-pattern.md's "Cards are
// 4:3" section for the full back-and-forth (including a poster/overlay
// attempt that got the ratio right but wasn't the stacked layout wanted).
//
// The button lives outside card con entirely (same reasoning as the
// original BranchSelectStep fix): dragging the model to inspect it must
// never double as "select this option," and structural separation is the
// robust fix for that, not a click-suppression heuristic.
export function EntityPickerCard({ icon: IconComponent, modelKey, title, selected, onClick }: EntityPickerCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-2 rounded-xl border bg-muted/10 p-2 backdrop-blur-sm transition-colors duration-200 ease-out",
        selected
          ? "border-blue-400/60 bg-blue-50/60 dark:border-blue-400/40 dark:bg-blue-400/10"
          : "border-border hover:border-blue-300/60 hover:bg-muted/20 dark:hover:border-blue-400/30",
      )}
    >
      {/* Card con — solid bg-background sitting on top of the translucent,
          backdrop-blurred muted frame, same nested-card treatment as
          LinkPreviewCard's CardShell. */}
      <div className="relative flex aspect-[4/3] flex-col overflow-hidden rounded-lg bg-background shadow-sm transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg">
        <div className="relative min-h-0 flex-1 bg-muted/40">
          {modelKey ? (
            <DragRotate3DCard modelKey={modelKey} className="absolute inset-0" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {IconComponent && <IconComponent className="h-2/3 w-2/3" />}
            </div>
          )}
        </div>
        <div className="shrink-0 px-2 py-1.5">
          <p className="line-clamp-1 text-xs font-medium sm:text-sm">{title}</p>
        </div>
      </div>

      <Button type="button" size="sm" onClick={onClick} className="w-full">
        Chọn mục này
        <ArrowRight size={14} className="ml-1" />
      </Button>
    </div>
  );
}
