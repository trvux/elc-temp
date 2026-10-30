"use client";

import { Input } from "@/shared/components/ui/input";

// Same underline-only, no-box look as every other step's Input in this
// form (ChoiceStep/free-text/rhf-text).
const UNDERLINE_FIELD_CLASS =
  "!type-subhead h-auto border-0 border-b-2 border-white/40 rounded-none px-0 py-2 shadow-none text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white bg-transparent";

interface AddressStepProps {
  question: string;
  description?: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

// Free-text "Bạn ở khu vực nào?" — one plain string reported straight to the
// parent (qualify[stepId], same flat shape as every other step). The
// tỉnh/thành + phường/xã pickers that used to sit here were removed along
// with the reference tables that fed them.
export function AddressStep({ question, description, onChange, onKeyDown }: AddressStepProps) {
  return (
    <div>
      <h1 id="step-question" className="type-headline text-white drop-shadow-sm">{question}</h1>
      {description && <p id="step-description" className="type-body mt-3 text-white/80 drop-shadow-sm">{description}</p>}

      <div role="group" aria-labelledby="step-question" aria-describedby={description ? "step-description" : undefined} className="mt-8">
        <Input
          onChange={(e) => onChange(e.target.value.trim())}
          onKeyDown={onKeyDown}
          aria-label="Khu vực của bạn"
          placeholder="Phường/xã, tỉnh/thành phố..."
          className={UNDERLINE_FIELD_CLASS}
        />
      </div>
    </div>
  );
}
