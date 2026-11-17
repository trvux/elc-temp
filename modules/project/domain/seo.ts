/**
 * Sinh headline (h1), meta_title, meta_description cho trang chi tiết dự án từ các trường có cấu trúc.
 * Quy tắc: docs/pseo-projects-plan.md (P3, D2, D8). Hàm thuần, không phụ thuộc gì khác.
 */

export const HEADLINE_MAX = 80;
export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 155;

export interface ProjectSeoFields {
  /** slug của loại công trình (project_type.slug) */
  typeSlug: string;
  /** từ vựng có kiểm soát: cassette-am-tran, treo-tuong, cap-khi-tuoi-thu-hoi-nhiet, ... */
  systems: string[];
  brands: string[];
  province?: string;
  district?: string;
  venueName?: string;
  /** loại hình cụ thể (shop thời trang, quán trà sữa...). Không có thì dùng tên loại công trình */
  venueKind?: string;
  /** ISO yyyy-mm-dd */
  completedAt?: string | null;
}

export interface ProjectSeoOptions {
  /** chọn khuôn câu; cùng input khác variant cho câu khác nhau */
  variant?: number;
  /** 0 = cơ bản; 1 = thêm năm; 2 = thêm tháng/năm (dùng để phân biệt khi trùng) */
  detail?: 0 | 1 | 2;
}

export interface ProjectSeoResult {
  headline: string;
  metaTitle: string;
  metaDescription: string;
}

const TYPE_NOUN: Record<string, string> = {
  "nha-pho": "nhà phố",
  "biet-thu": "biệt thự",
  "chung-cu": "chung cư",
  "van-phong": "văn phòng",
  "nha-hang-trung-tam-tiec-cuoi": "nhà hàng tiệc cưới",
  "co-so-kinh-doanh": "cơ sở kinh doanh",
  "co-so-giao-duc": "cơ sở giáo dục",
  "vui-choi-giai-tri": "khu vui chơi giải trí",
  "cong-trinh-cong-nghiep": "công trình công nghiệp",
  "tru-so-co-quan": "trụ sở cơ quan",
  "y-te": "cơ sở y tế",
  showroom: "showroom",
  "can-ho-dich-vu": "căn hộ dịch vụ",
};

/** [cụm đầy đủ, cụm ngắn dùng cho meta_title], theo thứ tự ưu tiên khi một dự án có nhiều hệ thống */
const AC_SYSTEMS: Array<[string, string, string]> = [
  ["vrv", "hệ thống VRV", "hệ thống VRV"],
  ["giau-tran-noi-ong-gio", "máy lạnh giấu trần nối ống gió", "máy lạnh giấu trần"],
  ["cassette-am-tran", "máy lạnh âm trần cassette", "máy lạnh âm trần"],
  ["ap-tran", "máy lạnh áp trần", "máy lạnh áp trần"],
  ["tu-dung", "máy lạnh tủ đứng", "máy lạnh tủ đứng"],
  ["treo-tuong", "máy lạnh treo tường", "máy lạnh treo tường"],
  ["multi", "máy lạnh multi", "máy lạnh multi"],
];
const FRESH_AIR = "cap-khi-tuoi-thu-hoi-nhiet";

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function systemPhrases(systems: string[]): { long: string; short: string; tiny: string } {
  const ac = AC_SYSTEMS.find(([k]) => systems.includes(k));
  const fresh = systems.includes(FRESH_AIR);
  if (ac && fresh) return { long: `${ac[1]} và cấp gió tươi`, short: `${ac[2]} và gió tươi`, tiny: ac[2] };
  if (ac) return { long: ac[1], short: ac[2], tiny: ac[2] };
  if (fresh) {
    return systems.includes("loc-khi")
      ? { long: "hệ thống lọc và cấp gió tươi thu hồi nhiệt", short: "lọc và cấp gió tươi", tiny: "gió tươi" }
      : { long: "hệ thống cấp gió tươi thu hồi nhiệt", short: "cấp gió tươi thu hồi nhiệt", tiny: "gió tươi thu hồi nhiệt" };
  }
  if (systems.includes("tach-am")) return { long: "máy tách ẩm", short: "máy tách ẩm", tiny: "máy tách ẩm" };
  if (systems.includes("loc-khi")) return { long: "hệ thống lọc không khí", short: "lọc không khí", tiny: "lọc không khí" };
  return { long: "hệ thống điều hòa không khí", short: "điều hòa không khí", tiny: "điều hòa không khí" };
}

function brandText(brands: string[]): string {
  const b = Array.from(new Set(brands));
  if (b.length === 0) return "";
  if (b.length === 1) return b[0];
  return `${b[0]} và ${b[1]}`;
}

/** các cách viết khu vực từ dài đến ngắn */
function areaCandidates(province?: string, district?: string): string[] {
  const p = (province ?? "").trim();
  const d = (district ?? "").trim();
  if (!p && !d) return [""];
  if (p === "TP.HCM") return d ? [`${d}, TP.HCM`, d, "TP.HCM"] : ["TP.HCM"];
  if (d && p) {
    // "TP. Vĩnh Long" đã chứa tên tỉnh thì không lặp lại
    const same = d.toLowerCase().includes(p.toLowerCase());
    return same ? [d, p] : [`${d}, ${p}`, d, p];
  }
  return [p || d];
}

function yearOf(iso?: string | null): string {
  const m = iso?.match(/^(\d{4})/);
  return m ? m[1] : "";
}

function monthYear(iso?: string | null): string {
  const m = iso?.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[2]}/${m[1]}` : "";
}

function firstFitting(candidates: string[], max: number): string | null {
  return candidates.find((c) => c.length <= max) ?? null;
}

export function buildProjectSeo(fields: ProjectSeoFields, opts: ProjectSeoOptions = {}): ProjectSeoResult {
  const variant = Math.abs(opts.variant ?? 0);
  const detail = opts.detail ?? 0;
  const type = (fields.venueKind ?? "").trim() || (TYPE_NOUN[fields.typeSlug] ?? "công trình");
  const sys = systemPhrases(fields.systems);
  const brand = brandText(fields.brands);
  const areas = areaCandidates(fields.province, fields.district);
  const year = yearOf(fields.completedAt);
  const when = monthYear(fields.completedAt);

  const brandOpts = brand ? [` ${brand}`, ""] : [""];
  const extra = (): string => {
    if (detail >= 2 && when) return ` (${when})`;
    if (detail >= 1 && year) return ` (${year})`;
    return "";
  };

  // sản phẩm đứng trước, rồi loại hình, rồi khu vực; không có "cho". Biến thể chỉ đổi động từ mở đầu.
  type Tpl = (sysText: string, b: string, area: string) => string;
  const verbs = ["", "Lắp ", "Thi công ", "Lắp đặt "];
  const headlineTpls: Tpl[] = verbs.map((v) => (s, b, a) => `${v}${s}${b} ${type}${a ? ` tại ${a}` : ""}`);
  const metaTpls: Tpl[] = verbs.map((v) => (s, b, a) => `${v}${s}${b} ${type}${a ? ` ${a}` : ""}`);

  const build = (tpls: Tpl[], sysLong: boolean, max: number): string => {
    const ordered = tpls.map((_, i) => tpls[(variant + i) % tpls.length]);
    // ưu tiên giữ khu vực chi tiết hơn là giữ cụm hệ thống đầy đủ: thử với extra, rồi bỏ extra;
    // trong mỗi lượt thử cụm hệ thống đầy đủ rồi cụm ngắn, có thương hiệu rồi không, khu vực dài rồi ngắn
    const sysForms = sysLong ? [sys.long, sys.short] : [sys.short, sys.tiny];
    for (const useExtra of [true, false]) {
      for (const area of areas) {
        for (const sysText of sysForms) {
          // thêm năm/tháng không được phép đẩy thương hiệu ra khỏi tiêu đề
          for (const b of useExtra ? brandOpts.slice(0, 1) : brandOpts) {
            for (const tpl of ordered) {
              const candidate = tpl(sysText, b, area) + (useExtra ? extra() : "");
              if (candidate.length <= max) return candidate;
            }
          }
        }
      }
    }
    for (const sysText of [sys.short, sys.tiny]) {
      for (const tpl of ordered) {
        const candidate = tpl(sysText, "", "");
        if (candidate.length <= max) return candidate;
      }
    }
    return ordered[0](sys.tiny, "", "").slice(0, max);
  };

  const headline = cap(build(headlineTpls, true, HEADLINE_MAX));
  const metaTitle = cap(build(metaTpls, false, META_TITLE_MAX));

  const area0 = areas[0];
  const desc = firstFitting(
    [
      `Dự án ${sys.long}${brand ? ` ${brand}` : ""} ${type}${area0 ? ` tại ${area0}` : ""}${when ? `, hoàn thành ${when}` : ""}. Xem hạng mục thi công và quy mô thiết bị.`,
      `Dự án ${sys.long}${brand ? ` ${brand}` : ""} ${type}${area0 ? ` tại ${area0}` : ""}. Xem hạng mục thi công và quy mô thiết bị.`,
      `Dự án ${sys.short} ${type}${area0 ? ` tại ${area0}` : ""}.`,
    ],
    META_DESCRIPTION_MAX,
  );

  return { headline, metaTitle, metaDescription: desc ?? `Dự án ${sys.short} ${type}.` };
}

/** Số ổn định từ slug để chọn khuôn câu (không dùng Math.random để kết quả lặp lại được). */
export function variantOf(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % 4;
}
