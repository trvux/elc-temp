"use client";

import { cn } from "@/shared/lib/utils";

interface EntityPickerCardProps {
  title: string;
  selected?: boolean;
  onClick: () => void;
}

// Bare presentational selection button for the lead form's catalog pickers —
// plain text button, same style as ChoiceStep's chips. No illustration/3D
// model: the form's picker steps deliberately dropped imagery in favor of
// text-only buttons everywhere (see ChoiceStep, BranchSelectStep).
export function EntityPickerCard({ title, selected, onClick }: EntityPickerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-colors sm:text-base drop-shadow-sm",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-white/40 text-white hover:border-white",
      )}
    >
      {title}
    </button>
  );
}
