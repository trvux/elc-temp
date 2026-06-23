"use client";


import { TypographyP } from "@/shared/components/ui/typography";
import { AnimatePresence, m } from "framer-motion";
import * as React from "react";

import { Contact } from "@/modules/contact/domain";
import { HeroContactActions } from "./hero-contact-actions";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  contacts?: Contact[];
}

const ROTATING_WORDS = ["Thuần khiết", "Thông minh"];

export function HeroSection({
  contacts = [],
}: HeroSectionProps) {
  const [wordIndex, setWordIndex] = React.useState(0);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const triggerAnimation = () => {
      window.removeEventListener("scroll", triggerAnimation);
      window.removeEventListener("touchstart", triggerAnimation);
      window.removeEventListener("mousemove", triggerAnimation);

      timer = setTimeout(() => {
        setWordIndex(1);
      }, 1500);
    };

    window.addEventListener("scroll", triggerAnimation, { passive: true });
    window.addEventListener("touchstart", triggerAnimation, { passive: true });
    window.addEventListener("mousemove", triggerAnimation, { passive: true });

    return () => {
      window.removeEventListener("scroll", triggerAnimation);
      window.removeEventListener("touchstart", triggerAnimation);
      window.removeEventListener("mousemove", triggerAnimation);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8 py-8 md:py-12">
      <div className="flex flex-col gap-6 items-center justify-center text-center max-w-4xl w-full">
        {/* Premium Underlined Typographic Heading */}
        <h1 className="z-10 max-w-5xl text-3xl font-extrabold sm:text-5xl lg:text-6xl leading-tight sm:leading-none tracking-tight sm:whitespace-nowrap">
          Giải pháp Không khí{" "}
          <span className="relative text-foreground font-black inline-block">
            <AnimatePresence mode="wait" initial={false}>
              <m.span
                key={wordIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="inline-block text-foreground will-change-transform"
              >
                {ROTATING_WORDS[wordIndex]}
              </m.span>
            </AnimatePresence>
            <svg
              width="453"
              height="8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 text-foreground/80"
              preserveAspectRatio="none"
            >
              <path
                d="M2 6.75068C53.4722 -1.10509 368.533 2.14284 451.5 6.75085"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Description */}
        <TypographyP className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Điện máy ELC chuyên cung cấp, thi công lắp đặt trọn gói các dòng
          điều hòa không khí, hệ thống cấp khí tươi thu hồi nhiệt và lọc không
          khí cho công trình dân dụng đến công nghiệp từ những thương hiệu uy
          tín hàng đầu.
        </TypographyP>

        {/* Action Buttons */}
        <div className="w-full">
          <HeroContactActions contacts={contacts} />
        </div>
      </div>
    </div>
  );
}
