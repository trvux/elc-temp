import {
  PhoneIcon,
  EmailIcon,
  FacebookIcon,
  MessengerIcon,
  ZaloIcon,
  TiktokIcon,
  YoutubeIcon,
  WebsiteIcon,
} from "@/shared/components/ui/social-icons";

export const CONTACT_TYPES = [
  { value: "phone", label: "Điện thoại", icon: PhoneIcon },
  { value: "email", label: "Email", icon: EmailIcon },
  { value: "facebook", label: "Facebook", icon: FacebookIcon },
  { value: "messenger", label: "Messenger", icon: MessengerIcon },
  { value: "zalo", label: "Zalo", icon: ZaloIcon },
  { value: "tiktok", label: "Tiktok", icon: TiktokIcon },
  { value: "youtube", label: "Youtube", icon: YoutubeIcon },
  { value: "website", label: "Website", icon: WebsiteIcon },
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number]["value"];
