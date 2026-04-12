"use client";

import { useState, useEffect, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FacebookIcon,
  ZaloIcon,
  MessengerIcon,
  PhoneIcon,
  EmailIcon,
  WebsiteIcon,
  LinkIcon,
} from "@/components/social-icons";

interface Contact {
  id: string;
  type: string;
  label: string;
  value: string;
  order_index: number;
}

function getContactIcon(type: string) {
  switch (type) {
    case "phone":
      return PhoneIcon;
    case "email":
      return EmailIcon;
    case "facebook":
      return FacebookIcon;
    case "messenger":
      return MessengerIcon;
    case "zalo":
      return ZaloIcon;
    case "website":
      return WebsiteIcon;
    default:
      return LinkIcon;
  }
}

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

export function HeroContactButton({ contacts }: { contacts: Contact[] }) {
  const [currentContactIndex, setCurrentContactIndex] = useState(0);

  useEffect(() => {
    if (contacts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentContactIndex((prev) => (prev + 1) % contacts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [contacts]);

  const currentContact = contacts[currentContactIndex];

  if (!currentContact) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="w-full h-12 text-base font-semibold md:col-span-3 lg:col-span-4 xl:col-span-4"
      >
        Liên hệ hỗ trợ
      </Button>
    );
  }

  const ContactIcon = getContactIcon(currentContact.type) as ComponentType<{
    size?: number;
    className?: string;
  }>;
  const href = getContactHref(currentContact.type, currentContact.value);
  const isProtocol =
    currentContact.type === "phone" || currentContact.type === "email";

  return (
    <Button
      asChild
      variant="outline"
      size="lg"
      className="w-full h-12 text-base font-semibold group flex items-center overflow-hidden relative border-foreground/20 hover:border-foreground/40 bg-transparent transition-all duration-300 md:col-span-3 lg:col-span-4 xl:col-span-4"
    >
      <a
        href={href}
        target={isProtocol ? undefined : "_blank"}
        rel="noopener noreferrer"
      >
        <div className="grid grid-cols-10 items-center animate-in fade-in slide-in-from-bottom-2 duration-500 w-full h-full">
          <div className="col-span-2 flex justify-center items-center border-r border-foreground/5 h-full">
            <ContactIcon
              size={18}
              className="text-primary transition-colors drop-shadow-sm"
            />
          </div>
          <div className="col-span-8 flex flex-col items-center md:items-start md:pl-4 leading-tight">
            <span className="text-xs font-bold text-primary/60 normal-case mb-0.5 scale-90 origin-center md:origin-left text-center md:text-left">
              {currentContact.label || currentContact.type}
            </span>
            <span className="text-sm font-bold truncate w-full text-foreground tracking-tight text-center md:text-left">
              {currentContact.value}
            </span>
          </div>
        </div>
      </a>
    </Button>
  );
}
