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
          className="fixed bottom-2 right-4 md:right-6 lg:right-8"
        >
          <div className="flex items-center gap-2 px-2 py-2 bg-background/10 backdrop-blur-sm backdrop-brightness-125 backdrop-saturate-150 rounded-full border border-border/55 shadow-2xl w-auto">
            {/* <span className="text-sm font-bold">Liên hệ</span> */}
            {displayContacts.map((contact) => (
              <Button
                key={contact.id}
                asChild
                variant="ghost"
                className={cn(
                  "h-9 sm:h-10 px-5 rounded-full transition-all active:scale-95 border-none",
                  contact.type === "zalo"
                    ? "bg-blue-500 hover:bg-blue-600 "
                    : "",
                )}
              >
                <ContactLink
                  contact={contact}
                  onClick={() => handleAction(contact.type)}
                  iconProps={
                    {
                      size: contact.type === "zalo" ? 16 : 22,
                      weight: "fill",
                      ...(contact.type === "zalo" ? { stroke: 4 } : {}),
                    } as any
                  }
                  showLabel={false}
                  iconClassName={cn(
                    "flex items-center justify-center shrink-0",
                    contact.type === "zalo" ? "text-white" : "text-green-600 ",
                  )}
                >
                  {/* <span>
                    {contact.type === "phone" ? "Gọi ngay" : "Nhắn Zalo"}
                  </span> */}
                </ContactLink>
              </Button>
            ))}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
