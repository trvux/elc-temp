// Single source of truth for every "choice" step's option set across the
// lead form's 3 branches (LeadFormScreen.tsx builds the step list from
// these) AND for decoding a submitted Inquiry.qualifyData map back into
// Vietnamese labels for admin (InquiryManagement.tsx). Keeping both in one
// file means a new option can't be added to the form without also being
// decodable in the admin UI — the two used to live only as inline literals
// in LeadFormScreen, which is exactly how the admin dialog ended up
// printing raw codes like "budget: 10-20tr" instead of "10 - 20 triệu".

export interface ChoiceOption {
  value: string;
  label: string;
}

// --- Option sets for every "choice" step across the 3 branches ---
export const SCALE_OPTIONS: ChoiceOption[] = [
  { value: "<20m2", label: "Dưới 20m²" },
  { value: "20-40m2", label: "20 - 40m²" },
  { value: ">40m2", label: "Trên 40m²" },
  { value: "chua-ro", label: "Chưa rõ" },
];
export const PRODUCT_BUDGET_OPTIONS: ChoiceOption[] = [
  { value: "<10tr", label: "Dưới 10 triệu" },
  { value: "10-20tr", label: "10 - 20 triệu" },
  { value: ">20tr", label: "Trên 20 triệu" },
  { value: "chua-ro", label: "Chưa rõ" },
];
// Fallback "Ngân sách dự kiến?" scales for the 3 non-AC product groups —
// only used when that category (or, for máy lạnh/máy lọc không khí, that
// specific capacity tier) has no priced products yet — see
// LeadFormScreen's buildDynamicBudgetOptions, which always prefers the real
// price facet first. STILL PROVISIONAL: hand-guessed retail-price bands,
// not sourced from ELC's own price list (unlike PRODUCT_BUDGET_OPTIONS
// above, which matches real "Máy lạnh" prices) — flag to the user before
// trusting these numbers, don't just assume they're right because they're
// in code. Each becomes moot the moment admin prices that group's
// products — the dynamic path takes over automatically, no code change
// needed.
export const VENTILATION_BUDGET_FALLBACK_OPTIONS: ChoiceOption[] = [
  // Floor raised from an earlier "<10tr" guess after user feedback
  // (2026-09-06): a fresh-air/heat-recovery unit in this spec range
  // (~100-1400W rated power per the real cong_suat_dinh_danh attribute)
  // doesn't retail under ~20 triệu — still an unverified guess, just a
  // less wrong one than before.
  { value: "<20tr", label: "Dưới 20 triệu" },
  { value: "20-40tr", label: "20 - 40 triệu" },
  { value: ">40tr", label: "Trên 40 triệu" },
  { value: "chua-ro", label: "Chưa rõ" },
];
export const WATER_FILTER_BUDGET_FALLBACK_OPTIONS: ChoiceOption[] = [
  { value: "<5tr", label: "Dưới 5 triệu" },
  { value: "5-10tr", label: "5 - 10 triệu" },
  { value: ">10tr", label: "Trên 10 triệu" },
  { value: "chua-ro", label: "Chưa rõ" },
];
export const SMART_HOME_BUDGET_FALLBACK_OPTIONS: ChoiceOption[] = [
  { value: "<2tr", label: "Dưới 2 triệu" },
  { value: "2-5tr", label: "2 - 5 triệu" },
  { value: ">5tr", label: "Trên 5 triệu" },
  { value: "chua-ro", label: "Chưa rõ" },
];
export const WATER_FILTER_HOUSEHOLD_OPTIONS: ChoiceOption[] = [
  { value: "1-4-nguoi", label: "1 - 4 người" },
  { value: "5-8-nguoi", label: "5 - 8 người" },
  { value: ">8-nguoi", label: "Trên 8 người / quán ăn, văn phòng" },
  { value: "chua-ro", label: "Chưa rõ" },
];
export const YES_NO_OPTIONS: ChoiceOption[] = [
  { value: "co", label: "Có" },
  { value: "khong", label: "Không" },
];
export const PRODUCT_URGENCY_OPTIONS: ChoiceOption[] = [
  { value: "gap-1-2-ngay", label: "Gấp trong 1-2 ngày" },
  { value: "trong-tuan", label: "Trong tuần này" },
  { value: "tham-khao", label: "Chỉ tham khảo" },
];
export const SERVICE_SUPPORT_TYPE_OPTIONS: ChoiceOption[] = [
  { value: "maintenance", label: "Bảo dưỡng - vệ sinh định kỳ" },
  { value: "repair", label: "Sửa chữa - có sự cố" },
  { value: "tradein", label: "Thu cũ đổi máy mới" },
  { value: "install", label: "Lắp đặt máy mới" },
  { value: "rental", label: "Thuê máy" },
];
export const RENTAL_DURATION_OPTIONS: ChoiceOption[] = [
  { value: "ngan-han", label: "Ngắn hạn (theo ngày/tuần)" },
  { value: "theo-thang", label: "Theo tháng" },
  { value: "dai-han", label: "Theo mùa / dài hạn" },
];
export const DEVICE_COUNT_OPTIONS: ChoiceOption[] = [
  { value: "1", label: "1 thiết bị" },
  { value: "2-3", label: "2 - 3 thiết bị" },
  { value: ">3", label: "Trên 3 thiết bị" },
];
export const SYMPTOM_OPTIONS: ChoiceOption[] = [
  { value: "khong-lanh", label: "Không lạnh / không mát" },
  { value: "chay-nuoc", label: "Chảy nước" },
  { value: "mat-nguon", label: "Mất nguồn / không lên" },
  { value: "tieng-on", label: "Có tiếng ồn / mùi lạ" },
  { value: "bao-loi", label: "Báo lỗi / chớp đèn" },
  { value: "khac", label: "Khác" },
];
export const CONDITION_OPTIONS: ChoiceOption[] = [
  { value: "tot", label: "Còn chạy tốt" },
  { value: "loi-nhe", label: "Có lỗi nhỏ" },
  { value: "hong", label: "Đã hỏng hẳn" },
];
export const ACCESS_DIFFICULTY_OPTIONS: ChoiceOption[] = [
  { value: "tang-tret", label: "Tầng trệt / ban công dễ vào" },
  { value: "thang-thuong", label: "Trên cao, cần thang thường" },
  { value: "chung-cu-cao-tang", label: "Chung cư cao tầng, cần thiết bị chuyên dụng" },
  { value: "chua-ro", label: "Chưa rõ" },
];
export const SERVICE_URGENCY_OPTIONS: ChoiceOption[] = [
  { value: "gap-1-2-gio", label: "Gấp trong 1-2 giờ" },
  { value: "hom-nay-ngay-mai", label: "Trong hôm nay - ngày mai" },
  { value: "trong-tuan", label: "Trong tuần này" },
  { value: "tham-khao", label: "Chỉ tham khảo" },
];
// Three size tiers instead of one flat scale for all 13 project types —
// LeadFormScreen's deriveProjectSizeTier maps each project type to one of
// these based on the real spread seen across all 71 case studies in the
// DB (2026-09-06: "nhà phố" runs far smaller than "công trình công
// nghiệp", but no structured area/budget field exists on Project to
// derive this precisely). PROVISIONAL: these bands are an estimate from
// that read, not sourced ELC figures — the project branch's question text
// says "(tham khảo)"/"ước tính" for exactly this reason. Replace with real
// numbers if/when available; until then this is strictly better than one
// shared scale that doesn't fit either extreme.
export const PROJECT_SCALE_OPTIONS_SMALL: ChoiceOption[] = [
  { value: "<100m2", label: "Dưới 100m²" },
  { value: "100-200m2", label: "100 - 200m²" },
  { value: "200-400m2", label: "200 - 400m²" },
  { value: ">400m2", label: "Trên 400m²" },
  { value: "chua-ro", label: "Chưa rõ" },
];
export const PROJECT_SCALE_OPTIONS_MEDIUM: ChoiceOption[] = [
  { value: "<200m2", label: "Dưới 200m²" },
  { value: "200-500m2", label: "200 - 500m²" },
  { value: "500-1000m2", label: "500 - 1000m²" },
  { value: ">1000m2", label: "Trên 1000m²" },
  { value: "chua-ro", label: "Chưa rõ" },
];
export const PROJECT_SCALE_OPTIONS_LARGE: ChoiceOption[] = [
  { value: "<500m2", label: "Dưới 500m²" },
  { value: "500-1500m2", label: "500 - 1500m²" },
  { value: "1500-5000m2", label: "1500 - 5000m²" },
  { value: ">5000m2", label: "Trên 5000m²" },
  { value: "chua-ro", label: "Chưa rõ" },
];
export const PROJECT_BUDGET_OPTIONS_SMALL: ChoiceOption[] = [
  { value: "<100tr", label: "Dưới 100 triệu" },
  { value: "100-300tr", label: "100 - 300 triệu" },
  { value: "300-600tr", label: "300 - 600 triệu" },
  { value: ">600tr", label: "Trên 600 triệu" },
  { value: "chua-ro", label: "Chưa rõ, cần tư vấn" },
];
export const PROJECT_BUDGET_OPTIONS_MEDIUM: ChoiceOption[] = [
  { value: "<300tr", label: "Dưới 300 triệu" },
  { value: "300-700tr", label: "300 - 700 triệu" },
  { value: "700tr-1.5ty", label: "700 triệu - 1.5 tỷ" },
  { value: ">1.5ty", label: "Trên 1.5 tỷ" },
  { value: "chua-ro", label: "Chưa rõ, cần tư vấn" },
];
export const PROJECT_BUDGET_OPTIONS_LARGE: ChoiceOption[] = [
  { value: "<500tr", label: "Dưới 500 triệu" },
  { value: "500tr-1.5ty", label: "500 triệu - 1.5 tỷ" },
  { value: "1.5-5ty", label: "1.5 - 5 tỷ" },
  { value: ">5ty", label: "Trên 5 tỷ" },
  { value: "chua-ro", label: "Chưa rõ, cần tư vấn" },
];
export const PROJECT_STAGE_OPTIONS: ChoiceOption[] = [
  { value: "co-ban-ve", label: "Đã có bản vẽ thiết kế" },
  { value: "xay-tho", label: "Đang xây thô" },
  { value: "cai-tao", label: "Cải tạo - thay mới" },
  { value: "tham-khao", label: "Chỉ đang tham khảo giá" },
];
export const ROLE_OPTIONS: ChoiceOption[] = [
  { value: "chu-dau-tu", label: "Chủ đầu tư" },
  { value: "don-vi-thi-cong", label: "Đơn vị thi công / thầu phụ" },
  { value: "kts", label: "KTS / tư vấn thiết kế" },
  { value: "khac", label: "Khác" },
];
export const SITE_VISIT_OPTIONS: ChoiceOption[] = [
  { value: "co", label: "Có, sắp xếp lịch khảo sát" },
  { value: "chua-can", label: "Chưa cần, chỉ báo giá sơ bộ" },
];
export const CONTACT_PREFERENCE_OPTIONS: ChoiceOption[] = [
  { value: "goi-dien", label: "Gọi điện thoại" },
  { value: "zalo", label: "Nhắn tin Zalo" },
];

// Rounds to whole triệu — a budget option is a rough band for the visitor
// to tap, not a spec sheet, so "26,17 triệu" reads as false precision.
// Round-number bucket boundaries (VD 20tr/50tr) already come out whole;
// this only matters for the real min/max of a single-bucket capacity tier
// (see buildNumberBucketOptions), which rarely land on a round number.
export function formatMillion(vnd: number): string {
  return Math.round(vnd / 1_000_000).toLocaleString("vi-VN");
}

// Vietnamese question label per qualifyData key, for admin's "Thông tin
// khảo sát" list. One representative label per step id even where the
// customer-facing question wording varies slightly by branch/cluster (e.g.
// "scale" is "Quy mô/công suất cần lắp?" for máy lạnh but "Diện tích/quy mô
// cần lắp hệ thống?" for máy lọc không khí) — admin needs a stable header,
// not a verbatim replay of the exact question text shown that session.
export const QUALIFY_STEP_LABELS: Record<string, string> = {
  // "scale" holds an HP segment (may-lanh, e.g. "2.5 HP" — already
  // human-readable as-is) or an airflow band (may-loc-khong-khi, decoded
  // below) or a diện tích bucket (project/legacy fallback) depending on
  // which branch/cluster produced it — one stable header covers all three.
  scale: "Quy mô/công suất",
  budget: "Ngân sách dự kiến",
  tradeIn: "Thu cũ đổi mới",
  urgency: "Thời gian mong muốn",
  supportType: "Loại hỗ trợ",
  deviceCount: "Số lượng thiết bị",
  symptom: "Triệu chứng",
  oldDeviceInfo: "Đời máy / hãng máy cũ",
  condition: "Tình trạng máy",
  accessDifficulty: "Độ khó tiếp cận",
  rentalDuration: "Thời gian thuê",
  khuVuc: "Khu vực",
  contactPreference: "Liên hệ qua",
  productCategory: "Dòng sản phẩm",
  serviceGroup: "Nhóm dịch vụ",
  serviceCategory: "Dòng máy áp dụng",
  projectType: "Loại công trình",
  projectCategories: "Dòng máy cần lắp",
  stage: "Giai đoạn công trình",
  role: "Vai trò",
  siteVisit: "Khảo sát công trình",
  householdSize: "Số người sử dụng",
};

function toMap(options: ChoiceOption[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

function mergeMaps(...optionSets: ChoiceOption[][]): Record<string, string> {
  return Object.assign({}, ...optionSets.map(toMap));
}

// value -> label per qualifyData key. Several keys are reused across
// branches with genuinely different option sets (e.g. "scale" is
// SCALE_OPTIONS for product/service but one of 3 PROJECT_SCALE_OPTIONS_*
// tiers for project; "budget" has several scales) — safe to merge because
// none of those
// sets share a value string that means something different in another set
// (checked by hand; "chua-ro" is the only value repeated across sets and it
// always means the same "Chưa rõ" everywhere). Do NOT add a shared "co"/
// "khong" style value across two *different* keys' entries here — that's
// why tradeIn (YES_NO_OPTIONS) and siteVisit (SITE_VISIT_OPTIONS) stay
// scoped to their own key even though both happen to use "co".
export const QUALIFY_VALUE_LABELS: Record<string, Record<string, string>> = {
  scale: mergeMaps(SCALE_OPTIONS, PROJECT_SCALE_OPTIONS_SMALL, PROJECT_SCALE_OPTIONS_MEDIUM, PROJECT_SCALE_OPTIONS_LARGE),
  budget: mergeMaps(
    PRODUCT_BUDGET_OPTIONS,
    VENTILATION_BUDGET_FALLBACK_OPTIONS,
    WATER_FILTER_BUDGET_FALLBACK_OPTIONS,
    SMART_HOME_BUDGET_FALLBACK_OPTIONS,
    PROJECT_BUDGET_OPTIONS_SMALL,
    PROJECT_BUDGET_OPTIONS_MEDIUM,
    PROJECT_BUDGET_OPTIONS_LARGE,
  ),
  tradeIn: toMap(YES_NO_OPTIONS),
  urgency: mergeMaps(PRODUCT_URGENCY_OPTIONS, SERVICE_URGENCY_OPTIONS),
  supportType: toMap(SERVICE_SUPPORT_TYPE_OPTIONS),
  deviceCount: toMap(DEVICE_COUNT_OPTIONS),
  symptom: toMap(SYMPTOM_OPTIONS),
  condition: toMap(CONDITION_OPTIONS),
  accessDifficulty: toMap(ACCESS_DIFFICULTY_OPTIONS),
  rentalDuration: toMap(RENTAL_DURATION_OPTIONS),
  stage: toMap(PROJECT_STAGE_OPTIONS),
  role: toMap(ROLE_OPTIONS),
  siteVisit: toMap(SITE_VISIT_OPTIONS),
  contactPreference: toMap(CONTACT_PREFERENCE_OPTIONS),
  householdSize: toMap(WATER_FILTER_HOUSEHOLD_OPTIONS),
};

// Decodes one qualifyData [key, value] pair for admin display. Falls back
// to formatting a raw "min-max" VND range for "budget" (the dynamic,
// price-facet-derived options aren't in any static list above — see
// LeadFormScreen's buildDynamicBudgetOptions), then to the raw value itself
// for genuinely free-text keys (khuVuc, oldDeviceInfo) or anything this
// table doesn't know about yet — never hides data just because it can't be
// prettified.
export function decodeQualifyValue(stepId: string, value: string): string {
  const known = QUALIFY_VALUE_LABELS[stepId]?.[value];
  if (known) return known;
  // Dynamic, price-facet-derived "min-max" values (budget) or
  // attribute-facet-derived ones (scale's airflow band, from
  // buildAirflowOptions) aren't in any static list above — format them
  // straight from the raw range instead. An HP-segment "scale" value (e.g.
  // "2.5 HP") never matches this pattern, so it falls through to the raw
  // return below, which is already the right display text.
  const rangeMatch = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(value);
  if (rangeMatch) {
    const [, minStr, maxStr] = rangeMatch;
    if (stepId === "budget") return `${formatMillion(Number(minStr))} - ${formatMillion(Number(maxStr))} triệu`;
    if (stepId === "scale") return minStr === maxStr ? `${minStr} m³/h` : `${minStr} - ${maxStr} m³/h`;
  }
  return value;
}
