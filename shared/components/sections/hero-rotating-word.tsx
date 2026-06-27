"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";

const ROTATING_WORDS = ["Thuần khiết", "Thông minh"];

export function HeroRotatingWord() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
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
  );
}
