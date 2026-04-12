"use client";

import { LazyMotion, domAnimation } from "motion/react";
import React from "react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
