"use client";

import { cn } from "@/shared/lib/utils";

export interface ChoiceOption {
  value: string;
  label: string;
}

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
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance">
        {question}
      </h1>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              "rounded-full border-2 px-5 py-2.5 text-sm sm:text-base font-medium transition-colors",
              value === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
