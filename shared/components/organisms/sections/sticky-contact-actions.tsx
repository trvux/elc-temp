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

// Màu icon theo nhận diện từng kênh (cố ý không dùng token app, xem
// docs/design-system.md §4): gọi điện = green-600, Zalo #0068ff, Facebook
// #1877f2, Messenger = gradient chính thức (định nghĩa ở <defs> bên dưới).
// Nền nút luôn là kính trắng trung tính nên 3 kênh xanh vẫn phân biệt được
// bằng hình icon thay vì ba cục xanh đặc giống nhau.
const MESSENGER_GRADIENT_ID = "elc-messenger-gradient";
const CHANNEL_STYLE: Record<string, { label: string; color: string; icon: number }> = {
  phone: { label: "Gọi ngay", color: "#16a34a", icon: 24 },
  zalo: { label: "Nhắn Zalo", color: "#0068ff", icon: 24 },
  messenger: {
    label: "Nhắn Messenger",
    color: `url(#${MESSENGER_GRADIENT_ID})`,
    icon: 26,
  },
  facebook: { label: "Facebook", color: "#1877f2", icon: 26 },
};

// Kính mờ dùng chung cho nút "+" và 4 nút kênh.
const GLASS_FAB =
  "size-12 sm:size-14 p-0 rounded-full border border-border/60 bg-background/90 dark:bg-background/90 backdrop-blur-md shadow-lg transition-all active:scale-95 hover:bg-background";

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
    () => getDisplayContacts(contacts, { include: ["phone", "zalo", "messenger", "facebook"] }),
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
          <svg width="0" height="0" className="absolute" aria-hidden="true">
            <defs>
              <linearGradient id={MESSENGER_GRADIENT_ID} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#00b2ff" />
                <stop offset="0.5" stopColor="#006aff" />
                <stop offset="1" stopColor="#a334fa" />
              </linearGradient>
            </defs>
          </svg>
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
                      variant="outline"
                      size="icon"
                      className={GLASS_FAB}
                    >
                      <ContactLink
                        contact={contact}
                        aria-label={CHANNEL_STYLE[contact.type]?.label}
                        className="justify-center gap-0"
                        onClick={() => setIsOpen(false)}
                        iconProps={
                          {
                            size: CHANNEL_STYLE[contact.type]?.icon ?? 24,
                            weight: "fill",
                            color: CHANNEL_STYLE[contact.type]?.color,
                          } as React.ComponentProps<typeof ContactLink>["iconProps"]
                        }
                        showLabel={false}
                        iconClassName="flex items-center justify-center shrink-0"
                      />
                    </Button>
                  </m.div>
                ))}
            </AnimatePresence>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={isOpen ? "Đóng liên hệ" : "Liên hệ"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className={cn(GLASS_FAB, "text-foreground")}
            >
              <m.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center justify-center"
              >
                <Plus size={28} weight="bold" stroke="currentColor" strokeWidth={10} />
              </m.span>
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
