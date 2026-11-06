// Reads a floor area out of the free text a visitor typed ("3 tầng, 400m2",
// "1.200 m²", "100 mét vuông"). Used to give a system-installation lead its size
// band without asking the same thing twice: the brief already asks for the area.
// Returns the largest area found, or null when the text has none.

const AREA = /(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(?:m2|m²|m\^2|mét vuông|m vuông|met vuong)/gi;

function toNumber(raw: string): number {
  // "1.200" / "1,200" are thousands separators; "12,5" / "12.5" are decimals.
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, ""));
  return Number(raw.replace(",", "."));
}

export function parseAreaM2(text: string): number | null {
  const values = [...text.matchAll(AREA)].map((m) => toNumber(m[1])).filter((n) => Number.isFinite(n) && n > 0);
  return values.length > 0 ? Math.max(...values) : null;
}

// Same values as PROJECT_SCALE_OPTIONS_MEDIUM, so the lead priority badge and the
// admin labels keep working unchanged.
export function areaBand(areaM2: number): "<200m2" | "200-500m2" | "500-1000m2" | ">1000m2" {
  if (areaM2 > 1000) return ">1000m2";
  if (areaM2 >= 500) return "500-1000m2";
  if (areaM2 >= 200) return "200-500m2";
  return "<200m2";
}
