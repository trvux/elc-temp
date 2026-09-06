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

  if (
    inquiry.leadType === "service" &&
    q.supportType === "repair" &&
    q.urgency === "gap-1-2-gio"
  ) {
    return { label: "Hỏa tốc", variant: "destructive" };
  }

  if (
    inquiry.leadType === "project" &&
    (q.scale === ">1000m2" || q.budget === ">1ty")
  ) {
    return { label: "Giá trị cao", variant: "default" };
  }

  if (inquiry.leadType === "service" && q.supportType === "maintenance" && q.service) {
    return { label: "Chốt theo giá niêm yết", variant: "secondary" };
  }

  if (inquiry.leadType === "product" && (q.budget === "chua-ro" || q.urgency === "tham-khao")) {
    return { label: "Đang phân vân", variant: "outline" };
  }

  return null;
}
