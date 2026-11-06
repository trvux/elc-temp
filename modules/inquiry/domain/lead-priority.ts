import { Inquiry } from "./types";

export interface LeadPriority {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

// Telesale triage rules, computed at display time rather than stored as a
// backend field — cheap to iterate on (no migration needed to change a
// rule), and admin can always re-derive it from qualifyData. No match is
// the common case (most leads don't hit a special tier) and renders no badge.
export function computeLeadPriority(inquiry: Inquiry): LeadPriority | null {
  const q = inquiry.qualifyData;

  // Work on a unit the customer already has, needed within the hour. The
  // legacy form recorded the kind of support (repair); the current one records
  // the service's line. Both keep working so older leads still badge correctly.
  if (
    inquiry.leadType === "service" &&
    q.urgency === "gap-1-2-gio" &&
    (q.line === "dich-vu" || q.supportType === "repair")
  ) {
    return { label: "Hỏa tốc", variant: "destructive" };
  }

  if (
    inquiry.leadType === "project" &&
    (q.scale === ">1000m2" || q.budget === ">1ty")
  ) {
    return { label: "Giá trị cao", variant: "default" };
  }

  // The same triage for a building that needs a system: the "Thi công hệ thống"
  // door replaced the project form, so a large site arrives as a thi-cong service
  // lead (scale only; that door does not ask for a budget).
  if (inquiry.leadType === "service" && q.line === "thi-cong" && q.scale === ">1000m2") {
    return { label: "Giá trị cao", variant: "default" };
  }

  // The visitor picked "Nơi khác" for the region: ELC has not served that place, so the
  // question is whether to go there at all, which comes before whether the brief is complete.
  // Urgent and high-value leads above still win: those are worth a call either way.
  if (q.khuVucNgoai === "1") {
    return { label: "Ngoài khu vực", variant: "outline" };
  }

  // A service lead that answered every brief prompt can be quoted straight
  // away, with no round of questions first.
  if (
    inquiry.leadType === "service" &&
    Number(q.briefTotal) > 0 &&
    q.briefAnswered === q.briefTotal
  ) {
    return { label: "Đủ thông tin báo giá", variant: "secondary" };
  }

  if (inquiry.leadType === "service" && q.supportType === "maintenance" && q.service) {
    return { label: "Chốt theo giá niêm yết", variant: "secondary" };
  }

  if (inquiry.leadType === "product" && (q.budget === "chua-ro" || q.urgency === "tham-khao")) {
    return { label: "Đang phân vân", variant: "outline" };
  }

  return null;
}
