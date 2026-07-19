"use client";

import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";
import { Funnel, X, CaretRight } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { Badge } from "@/shared/components/ui/badge";

interface PublicFilterSidebarLayoutProps {
  filterPanel: ReactNode;
  children: ReactNode;
  activeFilterCount?: number;
  mobileLabel?: string;
  sheetTitle?: string;
  defaultOpen?: boolean;
}

export function PublicFilterSidebarLayout({
  filterPanel,
  children,
  activeFilterCount = 0,
  mobileLabel = "Lọc",
  sheetTitle = "Bộ lọc",
  defaultOpen = true,
}: PublicFilterSidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultOpen);

  return (
    <div className="relative flex w-full min-h-0 items-start">

      {/* DESKTOP SIDEBAR */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0",
          "transition-[width,opacity] duration-300 ease-in-out overflow-hidden",
          sidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none",
        )}
        aria-label={sheetTitle}
      >
        <div className={cn(
          "w-72 flex flex-col",
          "border-r border-border/60 bg-sidebar",
          "sticky top-[calc(var(--header-height,112px)+1px)]",
          "h-[calc(100vh-var(--header-height,112px)-2rem)]",
          "overflow-hidden",
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 shrink-0">
            <div className="flex items-center gap-2">
              <Funnel className="size-4 text-muted-foreground" weight="duotone" />
              <span className="text-sm font-semibold tracking-tight">{sheetTitle}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
              aria-label="Đóng bộ lọc"
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <Separator />
          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {filterPanel}
          </div>
        </div>
      </aside>

      {/* DESKTOP COLLAPSED TOGGLE STRIP */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={cn(
            "hidden lg:flex flex-col items-center justify-center gap-2",
            "w-9 shrink-0",
            "border-r border-border/60 bg-sidebar",
            "hover:bg-sidebar-accent transition-colors duration-150",
            "sticky top-[calc(var(--header-height,112px)+1px)]",
            "h-[calc(100vh-var(--header-height,112px)-2rem)]",
            "cursor-pointer group",
          )}
          aria-label="Mở bộ lọc"
          title="Mở bộ lọc"
        >
          <CaretRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span
            className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors tracking-widest leading-none"
            style={{ writingMode: "vertical-rl" }}
          >
            Bộ lọc
          </span>
        </button>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile filter trigger (top bar, only on small screens) */}
        <div className="flex lg:hidden items-center gap-3 px-4 sm:px-6 py-3 border-b border-border/60 bg-background/90 backdrop-blur-sm sticky top-[calc(var(--header-height,112px))] z-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                id="public-filter-mobile-trigger"
              >
                <Funnel className="size-3.5" weight="duotone" />
                {mobileLabel}
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-0.5 h-4 min-w-4 px-1 text-[10px] font-bold"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="!z-[300] w-full max-w-[320px] p-0 flex flex-col bg-sidebar"
            >
              <SheetHeader className="px-5 py-3.5 border-b border-border/60 shrink-0">
                <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Funnel className="size-4" weight="duotone" />
                  {sheetTitle}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Chọn các tiêu chí để lọc kết quả
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {filterPanel}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Page content */}
        <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
