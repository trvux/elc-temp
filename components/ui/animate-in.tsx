"use client";

import { LazyMotion, domAnimation, m, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  variant?: "fadeUp" | "fadeIn";
  delay?: number;
  as?: "div" | "section" | "li";
}

export function AnimateIn({
  children,
  className,
  variant = "fadeUp",
  delay = 0,
  as = "div",
}: AnimateInProps) {
  const base = variant === "fadeIn" ? fadeIn : fadeUp;
  const variants: Variants = {
    hidden: base.hidden,
    visible: {
      ...(base.visible as object),
      transition: {
        ...((base.visible as { transition?: object }).transition ?? {}),
        delay,
      },
    },
  };

  const Tag = m[as];

  return (
    <LazyMotion features={domAnimation} strict>
      <Tag
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={variants}
      >
        {children}
      </Tag>
    </LazyMotion>
  );
}

export function StaggerContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

/** Dùng bên trong StaggerContainer */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div className={className} variants={fadeUp}>
      {children}
    </m.div>
  );
}
