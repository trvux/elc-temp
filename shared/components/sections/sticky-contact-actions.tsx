"use client";

import { Contact } from "@/modules/contact/domain";
import { Button } from "@/shared/components/ui/button";
import { PhoneIcon, ZaloIcon } from "@/shared/components/ui/social-icons";
import { cn } from "@/shared/lib/utils";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface StickyContactActionsProps {
  contacts: Contact[];
}

export function StickyContactActions({ contacts }: StickyContactActionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  const hotline = contacts.find((c) => c.type === "phone");
  const zalo = contacts.find((c) => c.type === "zalo");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const footer = document.querySelector("footer");

      let isFooterVisible = false;
      if (footer) {
        const rect = footer.getBoundingClientRect();
        isFooterVisible = rect.top < window.innerHeight;
      }

      if (scrollY > 200 && !isFooterVisible) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getCleanValue = (val: string) => val.replace(/\s/g, "");

  const handleAction = (type: string) => {
    router.push(`/thank-you?source=${type}`);
  };

  if (!hotline && !zalo) return null;

  const glassStyle =
    "bg-background/60 backdrop-blur-md border border-white/80 shadow-md rounded-full ring-offset-background hover:bg-background hover:ring-primary/90 transition-all duration-300 hover:ring-2 hover:ring-offset-2";

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
    exit: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.3 },
    },
  };

  const commonBtnClass = "h-12 px-6 min-w-[280px] justify-center gap-3";

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed bottom-8 right-8 z-100 flex flex-col items-end gap-3"
        >
          {zalo && (
            <motion.div variants={itemVariants}>
              <Button
                asChild
                className={cn(commonBtnClass, glassStyle)}
                variant="outline"
              >
                <a
                  href={`https://zalo.me/${getCleanValue(zalo.value)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleAction("sticky_zalo")}
                  title={`Zalo: Tư vấn miễn phí: ${zalo.value}`}
                  className="flex items-center"
                >
                  <ZaloIcon size={18} className="text-blue-600 shrink-0" />
                  <span>Zalo: {zalo.value}</span>
                  <span>\</span>
                  <span>Tư vấn miễn phí</span>
                </a>
              </Button>
            </motion.div>
          )}

          {hotline && (
            <motion.div variants={itemVariants}>
              <Button
                asChild
                className={cn(commonBtnClass, glassStyle)}
                variant="outline"
              >
                <a
                  href={`tel:${getCleanValue(hotline.value)}`}
                  onClick={() => handleAction("sticky_hotline")}
                  title={`Gọi ngay: ${hotline.value}`}
                  className="flex items-center"
                >
                  <PhoneIcon size={14} className="text-green-600 shrink-0" />
                  <span>Số điện thoại: {hotline.value}</span>
                  <span>\</span>
                  <span>Gọi ngay</span>
                </a>
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
