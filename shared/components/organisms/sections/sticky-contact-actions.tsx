"use client";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";
import { Button } from "@/shared/components/ui/button";
import { useIsOverHero } from "@/shared/hooks/use-is-over-hero";
import { useProductFloating } from "@/shared/providers/product-floating-provider";
import { cn } from "@/shared/lib/utils";
import { AnimatePresence, m, Variants } from "motion/react";
import { Plus } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";

interface StickyContactActionsProps {
  contacts: Contact[];
}

export function StickyContactActions({ contacts }: StickyContactActionsProps) {
  const { active: productFloatingActive } = useProductFloating();
  const [isVisible, setIsVisible] = useState(false);
  // Speed-dial: collapsed by default (a lone "+" FAB takes far less of a
  // phone screen than two stacked buttons), expands on tap.
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isVisible) setIsOpen(false);
  }, [isVisible]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

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
          <div ref={rootRef} className="flex flex-col items-center gap-3">
            <AnimatePresence>
              {isOpen &&
                displayContacts.map((contact, i) => (
                  <m.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 12, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { delay: i * 0.05, duration: 0.25 },
                    }}
                    exit={{ opacity: 0, y: 12, scale: 0.8, transition: { duration: 0.15 } }}
                  >
                    <Button
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
                        onClick={() => setIsOpen(false)}
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
                  </m.div>
                ))}
            </AnimatePresence>
            <Button
              type="button"
              size="icon"
              aria-label={isOpen ? "Đóng liên hệ" : "Liên hệ"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className="size-12 sm:size-14 p-0 rounded-full shadow-lg transition-all active:scale-95"
            >
              <m.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center justify-center"
              >
                <Plus size={24} weight="bold" />
              </m.span>
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
