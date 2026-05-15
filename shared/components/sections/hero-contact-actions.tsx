import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";
import { Button } from "@/shared/components/ui/button";

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
          <Button
            asChild
            variant={contact.type === "zalo" ? "default" : "outline"}
            size="lg"
            className="w-full gap-2"
          >
            <ContactLink
              contact={contact}
              iconProps={{ size: 20, weight: "regular" }}
              showValue={contact.type !== "phone"}
            >
              {contact.type === "phone"
                ? `Gọi báo giá ngay - ${contact.value}`
                : `Tư vấn miễn phí - ${contact.value}`}
            </ContactLink>
          </Button>
        </div>
      ))}
    </div>
  );
}
