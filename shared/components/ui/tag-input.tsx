"use client";

import { useState } from "react";
import { Plus, X } from "@phosphor-icons/react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

// Free-text chip list editor (type a value, press Enter or click + to add,
// click the x on a chip to remove) — for a freeform set of strings where
// there's no fixed list to select from (e.g. option values like "Đỏ"/"Đen",
// or product-line MPN prefixes like "FTF"/"FTC"). Distinct from
// TagMultiSelect (shared/components/ui/tag-multi-select.tsx), which picks
// from an existing fixed entity list (the `tags` module) rather than
// accepting arbitrary typed values.
export function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <Badge key={v} variant="secondary" className="gap-1 pr-1">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X size={10} />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
          className="h-8"
        />
        <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={addValue}>
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );
}
