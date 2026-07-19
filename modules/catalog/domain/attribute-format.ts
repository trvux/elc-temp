import type { AttributeValue } from "./types";

// 1 kW = 3412.14 BTU/h — a fixed physics conversion, safe to auto-derive for
// display. Unlike this, HP ("ngựa") is a VN retail marketing bucket brands
// assign inconsistently around the BTU value, so it stays its own
// admin-picked select attribute (cong_suat_lam_lanh_hp), never computed.
export const BTU_PER_KW = 3412.14;

export const CAPACITY_BTU_ATTRIBUTE_CODE = "cong_suat_lam_lanh_btu";

export function btuToKw(btu: number): string {
  return (btu / BTU_PER_KW).toFixed(2);
}

// Shared by the product detail page's spec tab and the comparison table —
// both render the same AttributeValue rows and need identical formatting.
export function formatAttributeValue(av: AttributeValue): string {
  if (av.dataType === "boolean") return av.valueBoolean ? "Có" : "Không";
  // A single-select's picked value lives in the same valueOptions array as
  // multiselect (just constrained to one entry) — there's no separate
  // "selected label" field, so without this branch a select attribute with
  // no valueText renders as a blank value.
  if (av.dataType === "select" || av.dataType === "multiselect") return (av.valueOptions || []).join(", ");
  if (av.dataType === "number" && av.valueNumber != null) {
    const suffix = av.unit ? ` ${av.unit}` : "";
    const kwHint = av.code === CAPACITY_BTU_ATTRIBUTE_CODE && av.valueNumber > 0
      ? ` (≈ ${btuToKw(av.valueNumber)} kW)`
      : "";
    return `${av.valueNumber.toLocaleString("vi-VN")}${suffix}${kwHint}`;
  }
  const text = av.valueText || "";
  // Some legacy spec entries already have the unit baked into the text
  // itself (e.g. "285 x 770 x 223 mm"), others store it separately on the
  // definition only — append only when not already present, so neither
  // style ends up duplicated or missing.
  if (av.unit && text && !text.toLowerCase().includes(av.unit.toLowerCase())) {
    return `${text} ${av.unit}`;
  }
  return text;
}
