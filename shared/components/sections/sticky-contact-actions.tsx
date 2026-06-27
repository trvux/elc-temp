"use client";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";
import { Button } from "@/shared/components/ui/button";
import { useProductFloating } from "@/shared/providers/product-floating-provider";
import { cn } from "@/shared/lib/utils";
import { AnimatePresence, m, Variants } from "motion/react";
import { useEffect, useMemo, useState } from "react";

interface StickyContactActionsProps {
  contacts: Contact[];
}

export function StickyContactActions({ contacts }: StickyContactActionsProps) {
  const { active: productFloatingActive } = useProductFloating();
  const [isVisible, setIsVisible] = useState(false);

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

      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsVisible(scrollY > 200 && !isFooterVisible);
      } else {
        setIsVisible(!isFooterVisible);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  if (displayContacts.length === 0 || productFloatingActive) return null;

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
          className="fixed bottom-2 right-4 md:right-6 lg:right-8 z-[100]"
        >
          <div className="flex items-center gap-2 px-2 py-2 bg-background/10 backdrop-blur-sm backdrop-brightness-125 backdrop-saturate-50 rounded-full border border-border/55 shadow-2xl w-auto">
            {/* <span className="text-sm font-bold">Liên hệ</span> */}
            {displayContacts.map((contact) => (
              <Button
                key={contact.id}
                asChild
                variant={contact.type === "zalo" ? "default" : "ghost"}
                className={cn(
                  "h-9 sm:h-10 px-4 rounded-full transition-all active:scale-95 text-xs sm:text-sm flex items-center gap-1.5 font-semibold",
                  contact.type === "zalo"
                    ? "bg-[#242424] text-[#f5efe6] hover:bg-[#242424]/90 shadow-[0_0.84px_0.84px_-0.31px_rgba(36,36,36,0.15),0_1.99px_1.99px_-0.625px_rgba(36,36,36,0.15),0_3.63px_3.63px_-0.9375px_rgba(36,36,36,0.15),0_6.04px_6.04px_-1.25px_rgba(36,36,36,0.15),0_9.75px_9.75px_-1.56px_rgba(36,36,36,0.15),0_15.96px_15.96px_-1.875px_rgba(36,36,36,0.15),0_27.48px_27.48px_-2.19px_rgba(36,36,36,0.15),0_50px_50px_-2.5px_rgba(36,36,36,0.15)] border-none"
                    : "",
                )}
              >
                <ContactLink
                  contact={contact}
                  iconProps={
                    {
                      size: contact.type === "zalo" ? 15 : 18,
                      weight: "fill",
                    } as React.ComponentProps<typeof ContactLink>["iconProps"]
                  }
                  showLabel={false}
                  iconClassName={cn(
                    "flex items-center justify-center shrink-0",
                    contact.type === "zalo" ? "text-[#f5efe6]" : "",
                  )}
                >
                  <span
                    className={contact.type === "zalo" ? "text-[#f5efe6]" : ""}
                  >
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
