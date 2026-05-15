"use client";

import {
  EnvelopeSimpleIcon,
  GlobeIcon,
  IconProps,
  LinkIcon,
  MessengerLogoIcon,
  MetaLogoIcon,
  PhoneIcon,
  TiktokLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";

import { IconLetterZ } from "@tabler/icons-react";

import { cn } from "@/shared/lib/utils";

export const getContactIcon = (type: string) => {
  const icons: Record<string, React.ElementType> = {
    phone: PhoneIcon,
    email: EnvelopeSimpleIcon,
    facebook: MetaLogoIcon,
    messenger: MessengerLogoIcon,
    zalo: IconLetterZ,
    tiktok: TiktokLogoIcon,
    youtube: YoutubeLogoIcon,
    website: GlobeIcon,
  };
  return icons[type] || LinkIcon;
};

interface ContactIconProps extends IconProps {
  type: string;
  className?: string;
}

export function ContactIcon({ type, className, ...props }: ContactIconProps) {
  const Icon = getContactIcon(type);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 aspect-square",
        className
      )}
    >
      <Icon {...props} />
    </span>
  );
}
