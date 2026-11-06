"use client";

import { Input } from "@/shared/components/ui/input";

interface BriefStepProps {
  prompts: string[];
  answers: Record<string, string>;
  onChange: (prompt: string, value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  // Shown under the fields when the visitor tries to continue with all of them empty.
  error?: string | null;
}

// The same list the service page shows ("send these first") and the Zalo
// message lists, rendered as optional inputs on ONE screen. One source (the
// service's brief_prompts, edited in admin) instead of a hardcoded question set
// per kind of support. Nothing here is required: whoever would rather answer in
// the Zalo chat can continue straight through.
export function BriefStep({ prompts, answers, onChange, onKeyDown, error }: BriefStepProps) {
  return (
    <div>
      <h1 id="step-question" className="type-headline text-white drop-shadow-sm">
        Thông tin giúp báo giá nhanh hơn
      </h1>
      <p id="step-description" className="type-body mt-3 text-white/80 drop-shadow-sm">
        Không bắt buộc. Điền được gì thì điền, phần còn lại nhân viên sẽ hỏi lại.
      </p>
      <div className="mt-8 flex flex-col gap-5">
        {prompts.map((prompt) => (
          <label key={prompt} className="flex flex-col gap-2">
            <span className="type-body-sm text-white/90 drop-shadow-sm">{prompt}</span>
            <Input
              value={answers[prompt] ?? ""}
              onChange={(e) => onChange(prompt, e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={300}
              className="h-auto border-0 border-b-2 border-white/40 rounded-none bg-transparent px-0 py-2 text-white shadow-none placeholder:text-white/50 focus-visible:border-white focus-visible:ring-0"
            />
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="type-body-sm mt-5 text-white drop-shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}
