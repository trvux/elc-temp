"use client";

// From shadcn-tiptap (MIT, github.com/NiazMorshed2007/shadcn-tiptap) —
// copied verbatim, not published as an installable registry.json entry
// upstream so pulled in by hand instead of `npx shadcn add`.
import type { Editor } from "@tiptap/react";
import React from "react";

export interface ToolbarContextProps {
  editor: Editor;
}

export const ToolbarContext = React.createContext<ToolbarContextProps | null>(
  null,
);

interface ToolbarProviderProps {
  editor: Editor;
  children: React.ReactNode;
}

export const ToolbarProvider = ({ editor, children }: ToolbarProviderProps) => {
  return (
    <ToolbarContext.Provider value={{ editor }}>
      {children}
    </ToolbarContext.Provider>
  );
};

export const useToolbar = () => {
  const context = React.useContext(ToolbarContext);

  if (!context) {
    throw new Error("useToolbar must be used within a ToolbarProvider");
  }

  return context;
};
