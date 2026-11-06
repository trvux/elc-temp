// Where ELC has actually delivered work, taken from the location of every
// published project (2026-11-06: 71 projects). Names are the provinces in force
// since the 1/7/2025 reorganisation into 34 units (Resolution 202/2025/QH15);
// alternateName keeps the former province names people still search for.
// Counts of projects behind each entry: TP.HCM 49 (HCM 43, Binh Duong 3,
// Ba Ria - Vung Tau 3), Dong Nai 8, Tay Ninh 4 (Long An 3, Tay Ninh 1),
// An Giang 2 (Kien Giang), Lam Dong 1 (Dak Nong), Vinh Long 2 (Vinh Long,
// Tra Vinh). Add an area only when a real project backs it.
export interface ServiceAreaGroup {
  /** Province in force since 1/7/2025: what JSON-LD `areaServed` names. */
  name: string;
  /** Former province names people still search for: JSON-LD `alternateName`. */
  alternateName: string[];
  /** What the lead form offers as chips: the places a visitor would say they are in. */
  provinces: string[];
}

export const SERVICE_AREA_GROUPS: ServiceAreaGroup[] = [
  {
    name: "Thành phố Hồ Chí Minh",
    alternateName: ["TP.HCM", "Bình Dương", "Bà Rịa - Vũng Tàu"],
    provinces: ["TP.HCM", "Bình Dương", "Bà Rịa - Vũng Tàu"],
  },
  { name: "Đồng Nai", alternateName: ["Bình Phước"], provinces: ["Đồng Nai", "Bình Phước"] },
  { name: "Tây Ninh", alternateName: ["Long An"], provinces: ["Tây Ninh", "Long An"] },
  { name: "An Giang", alternateName: ["Kiên Giang", "Phú Quốc"], provinces: ["An Giang", "Kiên Giang"] },
  { name: "Lâm Đồng", alternateName: ["Đắk Nông"], provinces: ["Lâm Đồng", "Đắk Nông"] },
  { name: "Vĩnh Long", alternateName: ["Trà Vinh", "Bến Tre"], provinces: ["Vĩnh Long", "Trà Vinh", "Bến Tre"] },
];

/** Every chip the lead form shows for "Bạn ở khu vực nào?", in group order. */
export const SERVICE_AREA_PROVINCES: string[] = SERVICE_AREA_GROUPS.flatMap((g) => g.provinces);

/** True when `value` is one of the form's province chips (exact label). */
export function isServiceAreaProvince(value: string): boolean {
  return SERVICE_AREA_PROVINCES.includes(value);
}
