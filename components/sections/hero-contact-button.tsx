"use client";

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
    if (!contacts || contacts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentContactIndex((prev) => (prev + 1) % contacts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [contacts]);

  const currentContact = contacts[currentContactIndex];

  // --- STYLES ---
  const styles = {
    wrapper: "flex items-center gap-3 w-full h-full text-left min-w-0",
    label:
      " font-bold text-muted-foreground/60 shrink-0 border-r border-border/50 pr-3",
    value: "text-sm font-semibold truncate flex-1",
    fallback: "text-sm font-medium",
  };

  if (!currentContact) {
    return <span className={styles.fallback}>Liên hệ hỗ trợ</span>;
  }

  const href = getContactHref(currentContact.type, currentContact.value);

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full w-full items-center"
      key={currentContact.id} // Re-mount for subtle browser transition
    >
      <div className={styles.wrapper}>
        <span className={styles.label}>
          {currentContact.label || currentContact.type}
        </span>
        <span className={styles.value}>{currentContact.value}</span>
      </div>
    </Link>
  );
}
