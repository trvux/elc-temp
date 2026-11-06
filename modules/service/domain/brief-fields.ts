// What a customer is asked for before staff can quote a service: typed fields
// (admin edits them per service), replacing the free-text list of prompts. The
// kind picks the control in the lead form and gives every field a "Chưa biết"
// answer; the stable key keeps a stored answer meaningful if admin rewords the
// label. Pure data and helpers, no React.

export const BRIEF_FIELD_KINDS = ["text", "number", "choice", "yesno", "area"] as const;
export type BriefFieldKind = (typeof BRIEF_FIELD_KINDS)[number];

export interface BriefField {
  /** Stable id a lead's answer is stored under; derived from the label when admin leaves it empty. */
  key: string;
  label: string;
  kind: BriefFieldKind;
  /** Shown after a number ("phòng"). number only. */
  unit?: string;
  /** The chips of a choice. choice only. */
  options?: string[];
}

export const BRIEF_KIND_LABEL: Record<BriefFieldKind, string> = {
  text: "Văn bản ngắn",
  number: "Số",
  choice: "Chọn một",
  yesno: "Có / Không",
  area: "Diện tích (m²)",
};

/** "Số phòng cần làm lạnh" -> "so_phong_can_lam_lanh". Mirrors elc-go's BriefKeyFromLabel. */
export function briefKeyFromLabel(label: string): string {
  const key = label
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key.slice(0, 40).replace(/_+$/, "");
}

function isKind(value: unknown): value is BriefFieldKind {
  return typeof value === "string" && (BRIEF_FIELD_KINDS as readonly string[]).includes(value);
}

/** Reads the API's brief_fields defensively: anything malformed is dropped rather than thrown. */
export function parseBriefFields(raw: unknown): BriefField[] {
  if (!Array.isArray(raw)) return [];
  const fields: BriefField[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const f = item as Record<string, unknown>;
    if (typeof f.label !== "string" || f.label.trim() === "" || typeof f.key !== "string") continue;
    fields.push({
      key: f.key,
      label: f.label,
      kind: isKind(f.kind) ? f.kind : "text",
      ...(typeof f.unit === "string" && f.unit ? { unit: f.unit } : {}),
      ...(Array.isArray(f.options) ? { options: f.options.filter((o): o is string => typeof o === "string") } : {}),
    });
  }
  return fields;
}

/**
 * The fields a service actually has: its typed fields, or, for a service nobody has
 * typed yet, its old free-text prompts as plain text fields. Everything downstream
 * (form, Zalo message, page block) reads this, so it works on both sides of the migration.
 */
export function effectiveBriefFields(fields: BriefField[], prompts: string[]): BriefField[] {
  if (fields.length > 0) return fields;
  const used = new Set<string>();
  const result: BriefField[] = [];
  for (const prompt of prompts) {
    const label = prompt.trim();
    if (!label) continue;
    const base = briefKeyFromLabel(label) || "field";
    let key = base;
    for (let n = 2; used.has(key); n++) key = `${base}_${n}`;
    used.add(key);
    result.push({ key, label, kind: "text" });
  }
  return result;
}

export function briefLabels(fields: BriefField[]): string[] {
  return fields.map((f) => f.label);
}

/** What admin submits: blank rows dropped, kind-specific extras kept only where they apply. */
export function cleanBriefFieldsForSave(fields: BriefField[]): BriefField[] {
  return fields
    .filter((f) => f.label.trim() !== "")
    .map((f) => {
      const label = f.label.trim();
      const base = { key: f.key.trim() || briefKeyFromLabel(label), label, kind: f.kind };
      if (f.kind === "number") return f.unit?.trim() ? { ...base, unit: f.unit.trim() } : base;
      if (f.kind === "choice") {
        const options = [...new Set((f.options ?? []).map((o) => o.trim()).filter(Boolean))];
        return { ...base, options };
      }
      return base;
    });
}
