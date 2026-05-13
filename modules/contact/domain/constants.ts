

export const CONTACT_TYPES = [
  { value: "phone", label: "Điện thoại" },
  { value: "email", label: "Email" },
  { value: "facebook", label: "Facebook" },
  { value: "messenger", label: "Messenger" },
  { value: "zalo", label: "Zalo" },
  { value: "tiktok", label: "Tiktok" },
  { value: "youtube", label: "Youtube" },
  { value: "website", label: "Website" },
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number]["value"];
