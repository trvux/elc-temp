// The 34 provincial-level units of Vietnam in force since 2025-07-01
// (Resolution 202/2025/QH15; names and codes per Decision 19/2025/QĐ-TTg).
// The district level was abolished: the model is province -> commune
// (xã / phường / đặc khu). Project facts store the CURRENT province name; the
// project's original free-text place (`location`) keeps whatever the old
// article said (e.g. "Bà Rịa - Vũng Tàu").
//
// `mergedFrom` lists the pre-merger provinces now inside each unit, so an old
// name found in an article maps to its current province (see
// `currentProvinceFor`). Source for the merge column: the 12/4/2025 draft list
// (Resolution 60-NQ/TW) cross-checked with the final names; the resolution
// text itself could not be fetched when this was written.

export interface Province {
  /** Canonical value stored in projects.province. */
  name: string;
  kind: "city" | "province";
  /** Decision 19/2025/QĐ-TTg code. */
  code: string;
  /** Pre-merger provinces now part of this unit (empty if unchanged). */
  mergedFrom: string[];
}

export const PROVINCES: readonly Province[] = [
  { name: "Hà Nội", kind: "city", code: "01", mergedFrom: [] },
  { name: "Cao Bằng", kind: "province", code: "04", mergedFrom: [] },
  { name: "Tuyên Quang", kind: "province", code: "08", mergedFrom: ["Hà Giang"] },
  { name: "Điện Biên", kind: "province", code: "11", mergedFrom: [] },
  { name: "Lai Châu", kind: "province", code: "12", mergedFrom: [] },
  { name: "Sơn La", kind: "province", code: "14", mergedFrom: [] },
  { name: "Lào Cai", kind: "province", code: "15", mergedFrom: ["Yên Bái"] },
  { name: "Thái Nguyên", kind: "province", code: "19", mergedFrom: ["Bắc Kạn"] },
  { name: "Lạng Sơn", kind: "province", code: "20", mergedFrom: [] },
  { name: "Quảng Ninh", kind: "province", code: "22", mergedFrom: [] },
  { name: "Bắc Ninh", kind: "province", code: "24", mergedFrom: ["Bắc Giang"] },
  { name: "Phú Thọ", kind: "province", code: "25", mergedFrom: ["Vĩnh Phúc", "Hòa Bình"] },
  { name: "Hải Phòng", kind: "city", code: "31", mergedFrom: ["Hải Dương"] },
  { name: "Hưng Yên", kind: "province", code: "33", mergedFrom: ["Thái Bình"] },
  { name: "Ninh Bình", kind: "province", code: "37", mergedFrom: ["Hà Nam", "Nam Định"] },
  { name: "Thanh Hóa", kind: "province", code: "38", mergedFrom: [] },
  { name: "Nghệ An", kind: "province", code: "40", mergedFrom: [] },
  { name: "Hà Tĩnh", kind: "province", code: "42", mergedFrom: [] },
  { name: "Quảng Trị", kind: "province", code: "44", mergedFrom: ["Quảng Bình"] },
  { name: "Huế", kind: "city", code: "46", mergedFrom: [] },
  { name: "Đà Nẵng", kind: "city", code: "48", mergedFrom: ["Quảng Nam"] },
  { name: "Quảng Ngãi", kind: "province", code: "51", mergedFrom: ["Kon Tum"] },
  { name: "Gia Lai", kind: "province", code: "52", mergedFrom: ["Bình Định"] },
  { name: "Khánh Hòa", kind: "province", code: "56", mergedFrom: ["Ninh Thuận"] },
  { name: "Đắk Lắk", kind: "province", code: "66", mergedFrom: ["Phú Yên"] },
  { name: "Lâm Đồng", kind: "province", code: "68", mergedFrom: ["Đắk Nông", "Bình Thuận"] },
  { name: "Đồng Nai", kind: "province", code: "75", mergedFrom: ["Bình Phước"] },
  { name: "Hồ Chí Minh", kind: "city", code: "79", mergedFrom: ["Bà Rịa - Vũng Tàu", "Bình Dương"] },
  { name: "Tây Ninh", kind: "province", code: "80", mergedFrom: ["Long An"] },
  { name: "Đồng Tháp", kind: "province", code: "82", mergedFrom: ["Tiền Giang"] },
  { name: "Vĩnh Long", kind: "province", code: "86", mergedFrom: ["Bến Tre", "Trà Vinh"] },
  { name: "An Giang", kind: "province", code: "91", mergedFrom: ["Kiên Giang"] },
  { name: "Cần Thơ", kind: "city", code: "92", mergedFrom: ["Sóc Trăng", "Hậu Giang"] },
  { name: "Cà Mau", kind: "province", code: "96", mergedFrom: ["Bạc Liêu"] },
];

export const PROVINCE_NAMES: readonly string[] = PROVINCES.map((p) => p.name);

const PROVINCE_SET = new Set<string>(PROVINCE_NAMES);

export function isProvince(name: string): boolean {
  return PROVINCE_SET.has(name);
}

/** Display form: "TP. Hồ Chí Minh", "Hà Nội", "Lâm Đồng". */
export function provinceLabel(name: string): string {
  const p = PROVINCES.find((x) => x.name === name);
  if (!p) return name;
  return p.kind === "city" && name !== "Hà Nội" && name !== "Huế" ? `TP. ${name}` : name;
}

// Accent- and punctuation-insensitive key so "Bà Rịa – Vũng Tàu", "BR-VT" style
// variants and missing diacritics still resolve.
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\b(tinh|thanh pho|tp)\b\.?/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const CURRENT_BY_NAME = new Map<string, string>();
for (const p of PROVINCES) {
  CURRENT_BY_NAME.set(fold(p.name), p.name);
  for (const old of p.mergedFrom) CURRENT_BY_NAME.set(fold(old), p.name);
}
// Common short forms that fold() alone does not normalise.
CURRENT_BY_NAME.set("hcm", "Hồ Chí Minh");
CURRENT_BY_NAME.set("ho chi minh", "Hồ Chí Minh");
CURRENT_BY_NAME.set("sai gon", "Hồ Chí Minh");
CURRENT_BY_NAME.set("ba ria vung tau", "Hồ Chí Minh");
CURRENT_BY_NAME.set("br vt", "Hồ Chí Minh");

/**
 * Maps any province name (current or pre-merger, with or without diacritics or
 * a "Tỉnh"/"TP." prefix) to its CURRENT province, or null if unknown. Used when
 * backfilling from old articles and as a hint in the admin form.
 */
export function currentProvinceFor(raw: string): string | null {
  return CURRENT_BY_NAME.get(fold(raw)) ?? null;
}
