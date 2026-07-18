"use client";

import { createContext, useContext } from "react";
import type { Contact } from "@/modules/contact/domain";

const ContactContext = createContext<Contact[]>([]);

// Pure passthrough, no fetch/mutation of its own — `contacts` is already
// fetched once server-side in app/(public)/layout.tsx (getPublicLayoutData)
// for Header/Footer. This just relays that same array via context so deep
// client components (BuyNowButton on every ProductCard, several layers
// under ProductGrid) can reach it without prop-drilling through every
// listing module in between.
export function ContactProvider({
  contacts,
  children,
}: {
  contacts: Contact[];
  children: React.ReactNode;
}) {
  return <ContactContext.Provider value={contacts}>{children}</ContactContext.Provider>;
}

export function useContacts() {
  return useContext(ContactContext);
}
