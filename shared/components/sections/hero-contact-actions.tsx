"use client";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";
import { buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface HeroContactActionsProps {
  contacts: Contact[];
}

export function HeroContactActions({ contacts }: HeroContactActionsProps) {
  const displayContacts = getDisplayContacts(contacts, {
    include: ["zalo", "phone"],
  });

  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center items-center w-full">
      {displayContacts.map((contact) => (
        <div key={contact.id} className="w-full sm:w-auto">
          <ContactLink
            contact={contact}
            iconProps={{ size: 20, weight: "regular" }}
            showValue={contact.type !== "phone"}
            className={cn(
              buttonVariants({
                variant: contact.type === "zalo" ? "default" : "outline",
                size: "lg",
              }),
              "w-full gap-2"
            )}
          >
            {contact.type === "phone"
              ? `Gọi báo giá ngay - ${contact.value}`
              : `Tư vấn miễn phí - ${contact.value}`}
          </ContactLink>
        </div>
      ))}
    </div>
  );
}

