"use client";

import { Contact } from "@/modules/contact/domain";
import { CONTACT_TYPES } from "@/modules/contact/domain/constants";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

function getContactHref(type: string, value: string) {
  const cleanValue = value.replace(/\s/g, "");
  if (value.startsWith("http")) return value;
  switch (type) {
    case "phone":
      return `tel:${cleanValue}`;
    case "email":
      return `mailto:${value}`;
    case "zalo":
      return `https://zalo.me/${cleanValue}`;
    case "messenger":
      return `https://m.me/${value}`;
    case "facebook":
      return `https://facebook.com/${value}`;
    default:
      return value;
  }
}

export function HeroContactButton({
  contacts,
  className,
}: {
  contacts: Contact[];
  className?: string;
}) {
  if (!contacts || contacts.length === 0) {
    return (
      <span className="text-sm font-medium text-muted-foreground/60">
        Liên hệ hỗ trợ
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" variant="outline" className={className}>
          <span>Liên hệ ngay</span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {contacts.map((contact) => {
          const typeInfo = CONTACT_TYPES.find((t) => t.value === contact.type);
          const label = contact.label || typeInfo?.label;

          return (
            <DropdownMenuItem
              key={contact.id}
              onClick={() => {
                window.open(
                  getContactHref(contact.type, contact.value),
                  "_blank",
                );
              }}
            >
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
