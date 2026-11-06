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

// What the brief asks for the "area to cool": a band to tap, because most visitors can
// name a size range but not a number, and ELC has no data of its own yet on how big
// its customers' sites are. The bands are fine on purpose: they can be merged later
// from the stored value ("100-150"), but a coarse answer could never be split.
// `scale` maps each band onto the four codes the lead priority badge and the admin
// labels already use, so "Giá trị cao" (> 1.000 m²) keeps working unchanged.
export interface AreaBandOption {
  value: string;
  label: string;
  scale: ReturnType<typeof areaBand>;
}

export const AREA_BANDS: readonly AreaBandOption[] = [
  { value: "<50", label: "Dưới 50 m²", scale: "<200m2" },
  { value: "50-100", label: "50 - 100 m²", scale: "<200m2" },
  { value: "100-150", label: "100 - 150 m²", scale: "<200m2" },
  { value: "150-200", label: "150 - 200 m²", scale: "<200m2" },
  { value: "200-300", label: "200 - 300 m²", scale: "200-500m2" },
  { value: "300-500", label: "300 - 500 m²", scale: "200-500m2" },
  { value: "500-1000", label: "500 - 1.000 m²", scale: "500-1000m2" },
  { value: ">1000", label: "Trên 1.000 m²", scale: ">1000m2" },
];

export function areaBandOption(value: string): AreaBandOption | undefined {
  return AREA_BANDS.find((b) => b.value === value);
}
