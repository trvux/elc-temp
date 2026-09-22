import { ContactChannel, InquiryStatus } from "./types";

export const INQUIRY_STATUSES: { value: InquiryStatus; label: string }[] = [
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "converted", label: "Đã chốt" },
  { value: "closed", label: "Đã đóng" },
];

// Shared by InquiryColumns (table badge) and InquiryManagement (detail
// dialog description) — one label set so the two can't drift apart.
export const CHANNEL_LABEL: Record<ContactChannel, string> = {
  form: "Form",
  zalo: "Zalo",
  messenger: "Messenger",
  hotline: "Hotline",
};
