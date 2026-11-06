import { formatFileSize, type InquiryAttachment } from "./attachments";
import { CHANNEL_LABEL, INQUIRY_STATUSES, LEAD_TYPE_LABEL } from "./constants";
import { computeLeadPriority } from "./lead-priority";
import { decodeQualifyValue, QUALIFY_STEP_LABELS } from "./qualify-options";
import type { Inquiry } from "./types";

// What the Excel download contains, as plain data: no spreadsheet library here,
// so the content (columns, labels, ordering) is testable without parsing an
// .xlsx. The workbook itself is assembled in infrastructure/export-workbook.ts.

export type ExportCell = string | number | Date | null;

export interface ExportColumn {
  header: string;
  /** Column width in characters. */
  width: number;
  /** Cell holds long free text: wrap it. */
  wrap?: boolean;
  /** Excel number format for number/Date cells. */
  numFmt?: string;
}

export interface ExportTable {
  columns: ExportColumn[];
  rows: ExportCell[][];
}

const STATUS_LABEL = Object.fromEntries(INQUIRY_STATUSES.map((s) => [s.value, s.label]));

// Left out of "Thông tin khảo sát": either shown in their own column already, or
// bookkeeping that means nothing to whoever reads the sheet (counts, a slug).
const QUALIFY_KEYS_NOT_LISTED = new Set(["khuVuc", "khuVucNgoai", "entityName", "briefAnswered", "briefTotal", "briefUnknown", "serviceSlug", "areaBand"]);

function parseDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * "Nhãn: giá trị" per line, labels and values decoded the way the admin dialog shows them.
 * The brief (several lines of its own) goes last so the short answers stay together.
 */
export function formatQualifyLines(qualifyData: Record<string, string>): string {
  return Object.entries(qualifyData)
    .filter(([key, value]) => !QUALIFY_KEYS_NOT_LISTED.has(key) && value !== "")
    .sort(([a], [b]) => Number(a === "brief") - Number(b === "brief"))
    .map(([key, value]) => `${QUALIFY_STEP_LABELS[key] ?? key}: ${decodeQualifyValue(key, value)}`)
    .join("\n");
}

/** What the lead is about: the product/service/project the visitor was on, else the form's chosen service. */
function interestOf(inquiry: Inquiry): string {
  const q = inquiry.qualifyData;
  return q.entityName || q.service || inquiry.interestHistory.find((t) => t.entityName)?.entityName || "";
}

/**
 * One line per file. A private file has no permanent link (staff open it in the admin through
 * a short-lived one), so the sheet names it and says where to find it; a legacy public photo
 * still carries its URL.
 */
function describeAttachment(a: InquiryAttachment): string {
  if (!a.private) return a.url ?? a.name;
  return `${a.name}${a.size ? ` (${formatFileSize(a.size)})` : ""} - xem trong admin`;
}

const LEAD_COLUMNS: ExportColumn[] = [
  { header: "Ngày gửi", width: 18, numFmt: "dd/mm/yyyy hh:mm" },
  { header: "Họ tên", width: 22 },
  { header: "Số điện thoại", width: 15 },
  { header: "Email", width: 24 },
  { header: "Kênh", width: 11 },
  { header: "Loại", width: 13 },
  { header: "Quan tâm", width: 32, wrap: true },
  { header: "Khu vực", width: 18 },
  { header: "Trạng thái", width: 12 },
  { header: "Ưu tiên", width: 20 },
  { header: "Nội dung khách gửi", width: 40, wrap: true },
  { header: "Thông tin khảo sát", width: 50, wrap: true },
  { header: "Tệp đính kèm", width: 40, wrap: true },
  { header: "Ghi chú nội bộ", width: 36, wrap: true },
  { header: "Giá trị đơn (VNĐ)", width: 16, numFmt: "#,##0" },
  { header: "Nguồn", width: 14 },
  { header: "Phương tiện", width: 12 },
  { header: "Chiến dịch", width: 22 },
  { header: "Mã Google Ads (gclid)", width: 24 },
  { header: "Cập nhật lần cuối", width: 18, numFmt: "dd/mm/yyyy hh:mm" },
];

export function buildLeadTable(inquiries: Inquiry[]): ExportTable {
  const rows = inquiries.map((i): ExportCell[] => [
    parseDate(i.createdAt),
    i.name,
    // A string on purpose: a number would drop the leading 0 of the phone.
    i.phone,
    i.email ?? "",
    CHANNEL_LABEL[i.channel] ?? i.channel,
    LEAD_TYPE_LABEL[i.leadType] ?? i.leadType,
    interestOf(i),
    i.qualifyData.khuVuc ?? "",
    STATUS_LABEL[i.status] ?? i.status,
    computeLeadPriority(i)?.label ?? "",
    i.message ?? "",
    formatQualifyLines(i.qualifyData),
    i.attachments.map(describeAttachment).join("\n"),
    i.internalNote ?? "",
    i.conversionValue,
    i.utmSource ?? "",
    i.utmMedium ?? "",
    i.utmCampaign ?? "",
    i.gclid ?? "",
    parseDate(i.updatedAt),
  ]);
  return { columns: LEAD_COLUMNS, rows };
}

const HISTORY_COLUMNS: ExportColumn[] = [
  { header: "Họ tên", width: 22 },
  { header: "Số điện thoại", width: 15 },
  { header: "Lead gửi lúc", width: 18, numFmt: "dd/mm/yyyy hh:mm" },
  { header: "Bấm lúc", width: 18, numFmt: "dd/mm/yyyy hh:mm" },
  { header: "Quan tâm", width: 40, wrap: true },
  { header: "Trang", width: 50 },
];

/** One row per click a visitor made before/after becoming a lead (Zalo/hotline leads accumulate these). */
export function buildHistoryTable(inquiries: Inquiry[]): ExportTable {
  const rows: ExportCell[][] = [];
  for (const i of inquiries) {
    for (const touch of i.interestHistory) {
      rows.push([
        i.name,
        i.phone,
        parseDate(i.createdAt),
        parseDate(touch.at),
        touch.entityName || "Liên hệ chung (không gắn sản phẩm/dịch vụ)",
        touch.pagePath ?? "",
      ]);
    }
  }
  return { columns: HISTORY_COLUMNS, rows };
}

/** lead-20261106-1432.xlsx, in Vietnam time so the name matches the clock on the wall. */
export function exportFileName(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `lead-${get("year")}${get("month")}${get("day")}-${get("hour")}${get("minute")}.xlsx`;
}
