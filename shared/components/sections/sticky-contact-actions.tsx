"use client";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { AnimatePresence, m, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface StickyContactActionsProps {
  contacts: Contact[];
}

export function StickyContactActions({ contacts }: StickyContactActionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  const displayContacts = useMemo(
    () => getDisplayContacts(contacts, { include: ["zalo", "phone"] }),
    [contacts],
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const footer = document.querySelector("footer");

      let isFooterVisible = false;
      if (footer) {
        const rect = footer.getBoundingClientRect();
        isFooterVisible = rect.top < window.innerHeight;
      }

      setIsVisible(scrollY > 200 && !isFooterVisible);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAction = (type: string) => {
    router.push(`/thank-you?source=sticky_${type}`);
  };

  if (displayContacts.length === 0) return null;

  const glassStyle =
    "bg-background/55 backdrop-blur-md border border-white/80 shadow-md rounded-full ring-offset-background hover:bg-background hover:ring-primary/10 transition-all duration-300 hover:ring-2 hover:ring-offset-2";

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.4,
        staggerDirection: -1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.1,
        staggerDirection: 1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  };

  const commonBtnClass = "h-12 px-6 min-w-[280px] justify-center gap-3";

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed bottom-8 right-8 z-100 flex flex-col items-end gap-3"
        >
          {displayContacts.map((contact) => (
            <m.div key={contact.id} variants={itemVariants}>
              <Button
                asChild
                className={cn(commonBtnClass, glassStyle)}
                variant="outline"
              >
                <ContactLink
                  contact={contact}
                  onClick={() => handleAction(contact.type)}
                  iconProps={{
                    size: 14,
                    weight: contact.type === "phone" ? "bold" : "regular",
                  }}
                  iconClassName={cn(
                    contact.type === "zalo"
                      ? "text-blue-600"
                      : "text-green-600",
                    "shrink-0",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>
                      {contact.label || contact.type}:{" "}
                      <span
                        className={
                          contact.type === "zalo"
                            ? "text-blue-700"
                            : "text-green-700"
                        }
                      >
                        {contact.value}
                      </span>
                    </span>
                    <span className="text-foreground/20 font-bold">\</span>
                    <span>
                      {contact.type === "zalo" ? "Tư vấn miễn phí" : "Gọi ngay"}
                    </span>
                  </span>
                </ContactLink>
              </Button>
            </m.div>
          ))}
        </m.div>
      )}
    </AnimatePresence>
  );
}
