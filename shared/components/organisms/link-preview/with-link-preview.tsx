"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LinkPreviewCard } from "./link-preview-card";

// Wraps a block of content whose <a> tags aren't React elements we control
// — either raw HTML from dangerouslySetInnerHTML (public rich-text
// rendering) or ProseMirror-owned DOM (the admin Tiptap editor) — neither
// can host a Radix HoverCardTrigger directly. Event delegation (a single
// mouseover/mouseout pair on this wrapper) plus a manually positioned
// portal gets the same hover-preview behavior without needing the content
// to be part of React's tree.
const OPEN_DELAY_MS = 350;
const CLOSE_DELAY_MS = 150;
const CARD_WIDTH = 288; // matches LinkPreviewCard's w-72
const VIEWPORT_MARGIN = 12;

function resolveHref(raw: string): string | null {
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
    return null;
  }
  try {
    return new URL(raw, window.location.origin).href;
  } catch {
    return null;
  }
}

export function WithLinkPreview({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [preview, setPreview] = useState<{ href: string; top: number; left: number } | null>(null);
  const activeAnchorRef = useRef<Element | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => {
      activeAnchorRef.current = null;
      setPreview(null);
    }, CLOSE_DELAY_MS);
  }, []);

  const handleMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a[href]");
    if (!anchor || anchor === activeAnchorRef.current) return;

    const href = resolveHref(anchor.getAttribute("href") || "");
    if (!href) return;

    if (closeTimer.current) clearTimeout(closeTimer.current);
    activeAnchorRef.current = anchor;

    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      if (activeAnchorRef.current !== anchor) return;
      const rect = anchor.getBoundingClientRect();
      const left = Math.min(
        Math.max(rect.left, VIEWPORT_MARGIN),
        window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN,
      );
      setPreview({ href, top: rect.bottom + 8, left });
    }, OPEN_DELAY_MS);
  }, []);

  const handleMouseOut = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor || anchor !== activeAnchorRef.current) return;
      // Moving onto the anchor's own descendant doesn't count as leaving.
      const related = e.relatedTarget as Node | null;
      if (related && anchor.contains(related)) return;
      scheduleClose();
    },
    [scheduleClose],
  );

  return (
    <div className={className} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
      {children}
      {preview &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: "fixed", top: preview.top, left: preview.left, zIndex: 9999 }}
            onMouseEnter={clearTimers}
            onMouseLeave={scheduleClose}
          >
            <LinkPreviewCard href={preview.href} />
          </div>,
          document.body,
        )}
    </div>
  );
}
