"use client";
import React from "react";

interface GridSectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  contentClassName?: string;
  // isFirst/showDiamond no longer do anything — kept only so the ~40
  // existing call sites across the site don't all need editing (see the
  // comment above the removed divider markup below for why). Safe to drop
  // both from the type and every call site in a follow-up sweep; not worth
  // doing as its own change right now.
  isFirst?: boolean;
  showDiamond?: boolean;
}

export function GridSection({
  children,
  id,
  className = "",
  // Responsive gutters/rhythm modeled on Linear's own real homepage layout
  // (measured directly against the live site at mobile/tablet/desktop
  // viewports, 2026-09-24) after being asked to drop the dashed-line +
  // diamond divider below in favor of a more open feel: Linear separates
  // every section with plain whitespace — border/border-top measured 0px
  // none, zero dashed elements, zero <hr>s anywhere on the page at any
  // viewport — and that whitespace itself scales up with the viewport
  // (measured section padding-block: ~0/48px/128px at mobile/tablet/
  // desktop) rather than staying a fixed size. py-12 (48px) at mobile
  // instead of Linear's near-0 since our sections aren't edge-to-edge
  // hero blocks that supply their own internal spacing the way Linear's
  // homepage sections do — collapsing to 0 here would visually crowd
  // unrelated sections together on small screens.
  contentClassName = "py-12 md:py-20 lg:py-32",
  isFirst: _isFirst = false,
  showDiamond: _showDiamond = true,
}: GridSectionProps) {
  return (
    <div id={id} className={`w-full relative ${className}`}>
      {/* No divider line/diamond here anymore — see contentClassName's own
          comment above. Horizontal gutter likewise modeled on Linear's
          measured side padding (~16px mobile, ~28px tablet, ~48px desktop):
          px-4 (16px) matches exactly; md:px-6 (24px) is the closest clean
          Tailwind step to Linear's 28px; lg:px-12 (48px) matches exactly. */}
      <div
        className={`mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
