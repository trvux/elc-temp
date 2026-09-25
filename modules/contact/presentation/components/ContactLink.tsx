"use client";
import React from "react";
import { cn } from "@/shared/lib/utils";
import { IconProps } from "@phosphor-icons/react";
import { Contact } from "../../domain";
import { ContactIcon } from "../utils";
import { trackContactClick } from "@/modules/inquiry";
import type { ContactChannel } from "@/modules/inquiry/domain";
import { primeLocation } from "@/shared/lib/geolocation";

// Maps Contact.type (this module's own taxonomy — phone/zalo/messenger/
// facebook/email/...) to ContactChannel (internal/inquiry's narrower lead-
// capture taxonomy) — only the 3 types that are real lead-capture channels
// in this business's model get tracked; facebook/email/etc have no
// matching ContactChannel and are left alone.
const TRACKABLE_CHANNEL: Partial<Record<string, ContactChannel>> = {
  phone: "hotline",
  zalo: "zalo",
  messenger: "messenger",
};

interface ContactLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  contact: Contact;
  iconProps?: IconProps;
  showLabel?: boolean;
  showValue?: boolean;
  iconClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export const ContactLink = React.forwardRef<HTMLAnchorElement, ContactLinkProps>(
  (
    {
      contact,
      iconProps = { size: 14, weight: "regular" },
      showLabel = true,
      showValue = false,
      className,
      iconClassName,
      labelClassName,
      valueClassName,
      onClick,
      children,
      ...props
    },
    ref,
  ) => {
    if (!contact) return null;

    const channel = TRACKABLE_CHANNEL[contact.type];

    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
      if (channel) trackContactClick({ channel });
      onClick?.(e);
    };

    return (
      <a
        ref={ref}
        href={contact.href}
        target={contact.isExternal ? "_blank" : undefined}
        rel={contact.isExternal ? "noopener noreferrer" : undefined}
        className={cn("flex items-center gap-2.5 cursor-pointer", className)}
        onClick={handleClick}
        onPointerDown={channel ? () => primeLocation() : undefined}
        {...props}
      >
        <ContactIcon
          type={contact.type}
          className={iconClassName}
          {...iconProps}
        />
        {(children || showLabel || showValue) && (
          <span className={cn(children ? "" : "flex items-center gap-1")}>
            {children || (
              <>
                {showLabel && (
                  <span className={cn("capitalize", labelClassName)}>
                    {contact.label || contact.type}
                  </span>
                )}
                {showLabel && showValue && <span>:</span>}
                {showValue && (
                  <span className={valueClassName}>{contact.value}</span>
                )}
              </>
            )}
          </span>
        )}
      </a>
    );
  },
);

ContactLink.displayName = "ContactLink";
