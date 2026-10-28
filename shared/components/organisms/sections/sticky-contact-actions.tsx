"use client";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";
import { Button } from "@/shared/components/ui/button";
import { useIsOverHero } from "@/shared/hooks/use-is-over-hero";
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
  // Hidden while floating over the homepage's full-viewport hero — it
  // already has its own prominent CTA pair, so the pill would just clutter
  // it. Reappears once scrolled past, same as everywhere else.
  const isOverHero = useIsOverHero();

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
      {isVisible && !isOverHero && (
        <m.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed bottom-4 right-4 md:right-6 lg:right-8 z-[100]"
        >
          <div className="flex flex-col items-center gap-3">
            {displayContacts.map((contact) => (
              <Button
                key={contact.id}
                asChild
                variant="default"
                size="icon"
                className={cn(
                  "size-12 sm:size-14 p-0 rounded-full border-none text-white transition-all active:scale-95 shadow-lg",
                  // Xanh Zalo (#0068ff) + xanh lá "gọi điện" (#16a34a, green-600 để
                  // icon trắng đạt tương phản ≥3:1) = màu nhận diện kênh liên hệ,
                  // cố ý không dùng token app (xem docs/design-system.md §4)
                  contact.type === "zalo"
                    ? "bg-[#0068ff] hover:bg-[#0068ff]/90"
                    : "bg-[#16a34a] hover:bg-[#16a34a]/90",
                )}
              >
                <ContactLink
                  contact={contact}
                  aria-label={contact.type === "phone" ? "Gọi ngay" : "Nhắn Zalo"}
                  className="justify-center gap-0"
                  iconProps={
                    {
                      size: contact.type === "zalo" ? 22 : 24,
                      weight: "fill",
                    } as React.ComponentProps<typeof ContactLink>["iconProps"]
                  }
                  showLabel={false}
                  iconClassName="flex items-center justify-center shrink-0 text-white"
                />
              </Button>
            ))}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
