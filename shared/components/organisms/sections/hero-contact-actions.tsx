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
              } as React.ComponentProps<typeof ContactLink>["iconProps"] & {
                stroke?: number;
              }
            }
            iconClassName={contact.type === "phone" ? "" : undefined}
            showValue={contact.type !== "phone"}
            className={cn(
              buttonVariants({
                variant: contact.type === "zalo" ? "default" : "ghost",
                size: "lg",
              }),
              " transition-all duration-200",
              contact.type === "zalo"
                ? "shadow-[0_0.84px_0.84px_-0.31px_rgba(36,36,36,0.15),0_1.99px_1.99px_-0.625px_rgba(36,36,36,0.15),0_3.63px_3.63px_-0.9375px_rgba(36,36,36,0.15),0_6.04px_6.04px_-1.25px_rgba(36,36,36,0.15),0_9.75px_9.75px_-1.56px_rgba(36,36,36,0.15),0_15.96px_15.96px_-1.875px_rgba(36,36,36,0.15),0_27.48px_27.48px_-2.19px_rgba(36,36,36,0.15),0_50px_50px_-2.5px_rgba(36,36,36,0.15)] border-none"
                : "",
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
