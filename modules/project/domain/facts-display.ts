import { provinceLabel } from "./provinces";
import { projectCondition, type CompletedPrecision, type ProjectFacts, type ProjectWithCategory } from "./types";

export interface FactRow {
  label: string;
  value: string;
}

const nf = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

/**
 * Completed date shown at the precision actually known. completedAt arrives as
 * an ISO string; only its date part is read (a DATE column has no timezone, and
 * parsing it through Date would shift the day for some viewers). A month-
 * precision project must never print as a full day.
 */
export function formatCompleted(
  completedAt: string | null | undefined,
  precision: CompletedPrecision,
): string | null {
  const m = completedAt?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m || precision === "unknown") return null;
  const [, y, mo, d] = m;
  if (precision === "year") return `Năm ${y}`;
  if (precision === "month") return `Tháng ${mo}/${y}`;
  return `${d}/${mo}/${y}`;
}

const CONDITION_LABEL = {
  new: "Thiết bị mới",
  used: "Thiết bị qua sử dụng",
  mixed: "Hỗn hợp (thiết bị mới và qua sử dụng)",
} as const;

/** True once at least one typed fact has been entered for the project. */
export function hasTypedFacts(f: ProjectFacts | undefined | null): boolean {
  if (!f) return false;
  return (
    f.province !== "" ||
    f.brands.length > 0 ||
    [f.indoorUnits, f.capacityHp, f.airflowM3h, f.areaM2, f.floors, f.durationDays, f.warrantyMonths].some(
      (n) => n !== null,
    )
  );
}

/**
 * The public "Thông tin dự án" rows, built ONLY from typed columns, always with
 * the same labels in the same order. A fact that is null/empty yields no row —
 * never a placeholder like "đang cập nhật".
 */
export function buildFactRows(
  project: Pick<ProjectWithCategory, "facts" | "completedAt" | "services" | "categories" | "clientName">,
): FactRow[] {
  const f = project.facts;
  const rows: FactRow[] = [];
  const add = (label: string, value: string | null | undefined) => {
    if (value) rows.push({ label, value });
  };

  const place = [f.ward, f.province ? provinceLabel(f.province) : ""].filter(Boolean).join(", ");
  add("Địa điểm", place);
  add("Hoàn thành", formatCompleted(project.completedAt, f.completedPrecision));
  add("Hệ thống", (project.services ?? []).map((s) => s.title).join(", "));
  add("Thiết bị", f.brands.join(", "));
  const condition = projectCondition(project.categories);
  add("Tình trạng thiết bị", condition ? CONDITION_LABEL[condition] : null);
  add("Số dàn lạnh / cửa gió", f.indoorUnits !== null ? nf.format(f.indoorUnits) : null);
  add("Tổng công suất", f.capacityHp !== null ? `${nf.format(f.capacityHp)} HP` : null);
  add("Lưu lượng gió", f.airflowM3h !== null ? `${nf.format(f.airflowM3h)} m³/h` : null);
  add("Diện tích", f.areaM2 !== null ? `${nf.format(f.areaM2)} m²` : null);
  add("Số tầng", f.floors !== null ? nf.format(f.floors) : null);
  add("Thời gian thi công", f.durationDays !== null ? `${nf.format(f.durationDays)} ngày` : null);
  add("Bảo hành", f.warrantyMonths !== null ? `${nf.format(f.warrantyMonths)} tháng` : null);
  // The Go API already blanks a natural person's name until consent is on
  // record, so a non-empty value here is safe to show.
  add("Chủ đầu tư", project.clientName?.trim());
  return rows;
}
