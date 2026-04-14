"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Contact {
  id: string;
  type: string;
  label: string;
  value: string;
  order_index: number;
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
      <Button variant="outline" size="lg">
        Liên hệ hỗ trợ
      </Button>
    );
  }

  const href = getContactHref(currentContact.type, currentContact.value);

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="h-full w-full"
    >
      {/* Bên trái: Label */}
      <div className="flex flex-row items-center justify-start w-full h-full gap-2">
        <span className="text-muted-foreground text-xs font-bold shrink-0 w-2/8">
          {currentContact.label}
        </span>
        <span className="border-r border-border h-full"></span>
        <span className="truncate text-base font-semibold text-center flex-1">
          {currentContact.value}
        </span>
      </div>
    </Link>
  );
}
