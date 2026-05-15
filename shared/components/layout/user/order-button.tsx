"use client";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useMemo } from "react";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";

interface OrderButtonProps {
  contacts: Contact[];
  include?: string[];
  exclude?: string[];
}

export function OrderButton({ contacts, include, exclude }: OrderButtonProps) {
  const displayContacts = useMemo(
    () => getDisplayContacts(contacts, { include, exclude }),
    [contacts, include, exclude],
  );

  if (displayContacts.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="lg">
          Tư vấn lắp đặt miễn phí
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuLabel>Phương thức liên lạc</DropdownMenuLabel>
        {displayContacts.map((contact) => (
          <DropdownMenuItem key={contact.id}>
            <ContactLink
              contact={contact}
              iconProps={{ size: 20, weight: "bold" }}
              showValue
              className="w-full"
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
