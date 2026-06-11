"use client";

import { IconContext } from "@phosphor-icons/react";
import React from "react";

export function AdminIconProvider({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider value={{ weight: "regular" }}>
      {children}
    </IconContext.Provider>
  );
}
