import { InquiryStatus } from "./types";

export const INQUIRY_STATUSES: { value: InquiryStatus; label: string }[] = [
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "converted", label: "Đã chốt" },
  { value: "closed", label: "Đã đóng" },
];
