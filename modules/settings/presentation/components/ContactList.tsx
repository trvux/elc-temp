import React from "react";
import { Contact } from "../../domain/types";
import { Phone, Envelope, MapPin, Globe } from "@phosphor-icons/react/dist/ssr";

interface ContactListProps {
  contacts: Contact[];
}

export const ContactList: React.FC<ContactListProps> = ({ contacts }) => {
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "phone": return <Phone className="w-4 h-4" />;
      case "email": return <Envelope className="w-4 h-4" />;
      case "address": return <MapPin className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <ul className="space-y-3">
      {contacts.map((contact) => (
        <li key={contact.id} className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {getIcon(contact.type)}
          </div>
          <div>
            <div className="font-medium">{contact.label}</div>
            <div className="text-muted-foreground">{contact.value}</div>
          </div>
        </li>
      ))}
    </ul>
  );
};
