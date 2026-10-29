"use client";

import { cn } from "@/shared/lib/utils";
import type { ChoiceOption } from "../../../domain";

export type { ChoiceOption };

interface ChoiceStepProps {
  question: string;
  description?: string;
  options: ChoiceOption[];
  value?: string;
  onSelect: (value: string) => void;
}

// Tapping an option advances immediately — no separate OK button, unlike
// the text-input steps. Single-select chips are the lowest-friction
// interaction Typeform-style forms have, so there's no reason to make the
// visitor confirm a tap with a second action.
export function ChoiceStep({ question, description, options, value, onSelect }: ChoiceStepProps) {
  return (
    <div>
      <h1 id="step-question" className="type-headline text-white drop-shadow-sm">
        {question}
      </h1>
      {description && <p id="step-description" className="type-body mt-3 text-white/80 drop-shadow-sm">{description}</p>}

      <div role="group" aria-labelledby="step-question" aria-describedby={description ? "step-description" : undefined} className="mt-8 flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              "rounded-lg border-2 px-5 py-2.5 type-caption sm:type-body transition-colors drop-shadow-sm",
              value === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/40 text-white hover:border-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
