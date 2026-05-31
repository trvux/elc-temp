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
    include: ["phone", "zalo"],
  });

  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center items-center w-full">
      {displayContacts.map((contact) => (
        <div key={contact.id} className="w-full sm:w-auto">
          <ContactLink
            contact={contact}
            iconProps={
              {
                size: 16,
                weight: "regular",
                ...(contact.type === "zalo" ? { stroke: 4 } : {}),
              } as any
            }
            iconClassName={contact.type === "phone" ? "" : undefined}
            showValue={contact.type !== "phone"}
            className={cn(
              buttonVariants({
                variant: contact.type === "zalo" ? "default" : "secondary",
                size: "lg",
              }),
              "w-full gap-3",
            )}
          >
            {contact.type === "phone"
              ? `Gọi ngay - ${contact.value}`
              : `Tư vấn - ${contact.value}`}
          </ContactLink>
        </div>
      ))}
    </div>
  );
}
