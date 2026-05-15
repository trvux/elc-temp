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
    () => getDisplayContacts(contacts, { include: ["phone", "zalo"] }),
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

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
    },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed bottom-8 inset-x-0 z-100 flex justify-center px-4 sm:px-8"
        >
          <div className="flex items-center gap-4 px-6 py-2 bg-background/55 backdrop-blur-xl rounded-2xl border shadow-2xl w-auto">
            <span className="text-sm font-bold">Liên hệ</span>
            {displayContacts.map((contact) => (
              <Button
                key={contact.id}
                asChild
                variant="ghost"
                className={cn(
                  "h-9 sm:h-10 px-4 sm:px-6 shadow-sm rounded-xl transition-all active:scale-95 border-none",
                  contact.type === "zalo"
                    ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                    : "bg-green-50 hover:bg-green-100 text-green-700",
                )}
              >
                <ContactLink
                  contact={contact}
                  onClick={() => handleAction(contact.type)}
                  iconProps={{ size: 18, weight: "bold" }}
                  showLabel={false}
                  iconClassName={cn(
                    contact.type === "zalo"
                      ? "text-blue-700"
                      : "text-green-700",
                  )}
                >
                  <span>
                    {contact.type === "phone" ? "Gọi ngay" : "Nhắn Zalo"}
                  </span>
                </ContactLink>
              </Button>
            ))}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
