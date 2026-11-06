"use client";

import { useEffect, useRef } from "react";
import { Check } from "@phosphor-icons/react";

import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import type { BriefField } from "@/modules/service/domain/brief-fields";

import { AREA_BANDS } from "../../../domain/area";
import { isSettled, isUnknown, UNKNOWN_ANSWER, YES_NO_OPTIONS } from "../../../domain/brief";

interface BriefStepProps {
  fields: BriefField[];
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  /** "Chưa biết hết": marks every field still blank as unknown in one tap. */
  onUnknownAll: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Keys of the blank fields, highlighted after a failed Tiếp tục. */
  missingKeys?: string[];
}

const UNDERLINE_INPUT =
  "h-auto border-0 border-b-2 border-white/40 rounded-none bg-transparent px-0 py-2 text-white shadow-none placeholder:text-white/50 focus-visible:border-white focus-visible:ring-0 disabled:opacity-40";

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 px-3.5 py-1.5 type-caption transition-colors drop-shadow-sm",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-white/40 text-white hover:border-white",
      )}
    >
      {children}
    </button>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  onKeyDown,
}: {
  field: BriefField;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const unknown = isUnknown(value);
  const current = unknown ? "" : value;

  // Every kind ends with the same "Chưa biết" chip: one gesture for "I cannot say",
  // so a visitor who does not know is never forced to invent an answer or to leave.
  const unknownChip = (
    <Chip selected={unknown} onClick={() => onChange(unknown ? "" : UNKNOWN_ANSWER)}>
      Chưa biết
    </Chip>
  );

  if (field.kind === "choice" || field.kind === "yesno" || field.kind === "area") {
    const options =
      field.kind === "area"
        ? AREA_BANDS.map((b) => ({ value: b.value, label: b.label }))
        : (field.kind === "yesno" ? [...YES_NO_OPTIONS] : (field.options ?? [])).map((o) => ({ value: o, label: o }));
    return (
      <div role="group" aria-label={field.label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} selected={current === o.value} onClick={() => onChange(current === o.value ? "" : o.value)}>
            {o.label}
          </Chip>
        ))}
        {unknownChip}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex min-w-0 flex-1 items-end gap-2">
        <Input
          value={current}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={unknown}
          aria-label={field.label}
          maxLength={field.kind === "number" ? 4 : 300}
          {...(field.kind === "number" ? { type: "text", inputMode: "numeric" as const, pattern: "[0-9]*" } : {})}
          placeholder={unknown ? "Chưa biết" : ""}
          className={UNDERLINE_INPUT}
        />
        {field.kind === "number" && field.unit && <span className="type-body-sm pb-2 text-white/80">{field.unit}</span>}
      </div>
      <div className="pb-1.5">{unknownChip}</div>
    </div>
  );
}

// One screen with every field the service needs to quote: the right control for each kind
// and a "Chưa biết" on every one. Each field is its own block so it is plain which label
// goes with which answer, a finished block looks finished and a missing one cannot be missed.
// Nothing may be left blank, so staff never get a lead with a name and nothing to quote from,
// but nothing forces a guess either.
export function BriefStep({ fields, answers, onChange, onUnknownAll, onKeyDown, missingKeys = [] }: BriefStepProps) {
  const blocks = useRef(new Map<string, HTMLElement>());
  const done = fields.filter((f) => isSettled(answers[f.key])).length;
  const missingLabels = fields.filter((f) => missingKeys.includes(f.key)).map((f) => f.label);

  // After a failed Tiếp tục, bring the first missing block into view: on a phone it may be
  // above the fold, and a screen that does not move looks like a button that does nothing.
  const firstMissing = missingKeys.length > 0 ? fields.find((f) => missingKeys.includes(f.key))?.key : undefined;
  const missingSignature = missingKeys.join("|");
  useEffect(() => {
    if (firstMissing) blocks.current.get(firstMissing)?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Only a new set of missing fields should scroll; typing in a block must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingSignature]);

  return (
    <div>
      <h1 id="step-question" className="type-headline text-white drop-shadow-sm">
        Thông tin giúp báo giá nhanh hơn
      </h1>
      <p id="step-description" className="type-body mt-3 text-white/80 drop-shadow-sm">
        Điền hoặc chọn &ldquo;Chưa biết&rdquo; ở từng mục, nhân viên sẽ hỏi lại phần chưa rõ.
      </p>

      {missingLabels.length > 0 ? (
        <p role="alert" className="type-body-sm mt-4 rounded-lg border-2 border-white bg-white/15 px-4 py-3 text-white drop-shadow-sm">
          Còn {missingLabels.length} mục chưa trả lời: {missingLabels.join(", ")}. Điền hoặc bấm &ldquo;Chưa biết&rdquo; ở mỗi mục.
        </p>
      ) : (
        <p aria-live="polite" className="type-body-sm mt-4 text-white/80 drop-shadow-sm">
          Đã xong {done}/{fields.length} mục
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {fields.map((field) => {
          const missing = missingKeys.includes(field.key);
          const settled = isSettled(answers[field.key]);
          return (
            <section
              key={field.key}
              ref={(el) => {
                if (el) blocks.current.set(field.key, el);
                else blocks.current.delete(field.key);
              }}
              aria-labelledby={`brief-${field.key}`}
              className={cn(
                "flex flex-col gap-3 rounded-xl border-2 p-4 transition-colors sm:p-5",
                missing ? "border-white bg-white/15" : settled ? "border-white/40 bg-white/5" : "border-white/20 bg-white/5",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id={`brief-${field.key}`} className="type-body-strong text-white drop-shadow-sm">
                  {field.label}
                </h2>
                {settled && <Check aria-label="Đã trả lời" weight="bold" size={18} className="shrink-0 text-white" />}
              </div>
              <FieldControl field={field} value={answers[field.key] ?? ""} onChange={(v) => onChange(field.key, v)} onKeyDown={onKeyDown} />
              {missing && <p className="type-legal text-white drop-shadow-sm">Mục này chưa trả lời: điền hoặc chọn &ldquo;Chưa biết&rdquo;.</p>}
            </section>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onUnknownAll}
        className="type-body-sm mt-6 text-white/90 underline underline-offset-4 hover:text-white"
      >
        Chưa biết hết, để nhân viên hỏi lại
      </button>
    </div>
  );
}
