"use client";

import { m, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// --- ANIMATION VARIANTS ---
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

// --- ANIMATE IN COMPONENT ---
interface AnimateInProps {
  children: ReactNode;
  className?: string;
  variant?: "fadeUp" | "fadeIn";
  delay?: number;
  duration?: number;
  as?: "div" | "section" | "li";
  immediate?: boolean;
  amount?: number;
  margin?: string;
}

export function AnimateIn({
  children,
  className,
  variant = "fadeUp",
  delay = 0,
  duration,
  as = "div",
  immediate = false,
  amount = 0.1,
  margin = "0px 0px -10% 0px",
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
      viewport={{ once: true, margin, amount }}
      variants={variants}
    >
      {children}
    </Tag>
  );
}

// --- STAGGER CONTAINER COMPONENT ---
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  immediate?: boolean;
  staggerDelay?: number;
  amount?: number;
  margin?: string;
}

export function StaggerContainer({
  children,
  className,
  immediate = false,
  staggerDelay = 0.1,
  amount = 0.1,
  margin = "0px 0px -10% 0px",
}: StaggerContainerProps) {
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
      viewport={{ once: true, margin, amount }}
      variants={variants}
    >
      {children}
    </m.div>
  );
}

// --- STAGGER ITEM COMPONENT ---
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function StaggerItem({
  children,
  className,
  duration = 0.5,
}: StaggerItemProps) {
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
