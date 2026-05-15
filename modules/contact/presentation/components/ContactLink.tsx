"use client";

import { cn } from "@/shared/lib/utils";
import { IconProps } from "@phosphor-icons/react";
import { Contact } from "../../domain";
import { ContactIcon } from "../utils";

interface ContactLinkProps {
  contact: Contact;
  iconProps?: IconProps;
  showLabel?: boolean;
  showValue?: boolean;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function ContactLink({
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
}: ContactLinkProps) {
  if (!contact) return null;

  return (
    <a
      href={contact.href}
      target={contact.isExternal ? "_blank" : undefined}
      rel={contact.isExternal ? "noopener noreferrer" : undefined}
      className={cn("flex items-center gap-2.5 cursor-pointer", className)}
      onClick={onClick}
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
}
