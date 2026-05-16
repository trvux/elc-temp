"use client";
import React from "react";
import { cn } from "@/shared/lib/utils";
import { IconProps } from "@phosphor-icons/react";
import { Contact } from "../../domain";
import { ContactIcon } from "../utils";

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

    return (
      <a
        ref={ref}
        href={contact.href}
        target={contact.isExternal ? "_blank" : undefined}
        rel={contact.isExternal ? "noopener noreferrer" : undefined}
        className={cn("flex items-center gap-2.5 cursor-pointer", className)}
        onClick={onClick}
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
