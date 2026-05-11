"use client";

import { m, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.02 } },
};

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  variant?: "fadeUp" | "fadeIn";
  delay?: number;
  duration?: number;
  as?: "div" | "section" | "li";
  immediate?: boolean;
}

export function AnimateIn({
  children,
  className,
  variant = "fadeUp",
  delay = 0,
  duration,
  as = "div",
  immediate = false,
}: AnimateInProps) {
  const base = variant === "fadeIn" ? fadeIn : fadeUp;
  const variants: Variants = {
    hidden: base.hidden,
    visible: {
      ...(base.visible as object),
      transition: {
        ...((base.visible as { transition?: object }).transition ?? {}),
        delay,
        ...(duration ? { duration } : {}),
      },
    },
  };

  const Tag = m[as];

  return (
    <Tag
      className={className}
      initial="hidden"
      animate={immediate ? "visible" : undefined}
      whileInView={immediate ? undefined : "visible"}
      viewport={{ once: true, margin: "0px 0px -10% 0px", amount: 0.1 }}
      variants={variants}
    >
      {children}
    </Tag>
  );
}

export function StaggerContainer({
  children,
  className,
  immediate = false,
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  immediate?: boolean;
  staggerDelay?: number;
}) {
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.02 } },
  };

  return (
    <m.div
      className={className}
      initial="hidden"
      animate={immediate ? "visible" : undefined}
      whileInView={immediate ? undefined : "visible"}
      viewport={{ once: true, margin: "0px 0px -10% 0px", amount: 0.3 }}
      variants={variants}
    >
      {children}
    </m.div>
  );
}

/** Dùng bên trong StaggerContainer */
export function StaggerItem({
  children,
  className,
  duration = 0.5,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  const variants: Variants = {
    hidden: fadeUp.hidden,
    visible: {
      ...(fadeUp.visible as object),
      transition: {
        ...((fadeUp.visible as { transition?: object }).transition ?? {}),
        duration,
      },
    },
  };

  return (
    <m.div className={className} variants={variants}>
      {children}
    </m.div>
  );
}
