"use client";

import { useRef } from "react";

// Radix Dialog's scroll-lock (react-remove-scroll) intercepts wheel AND
// touchmove events document-wide to stop body scroll leaking out from
// under an open modal — it calls preventDefault() on both, which also
// silently kills scrolling inside any non-"shard" scrollable region nested
// in the dialog (e.g. a Popover's dropdown list opened from inside an
// AdminDialog/Dialog form). preventDefault() doesn't stop propagation
// though, so our own handlers still fire — drive scrollTop manually
// instead of relying on the browser's now-blocked default scroll behavior.
// A combobox NOT nested in any Dialog (e.g. DeliveryEstimate on the public
// product page) never hits this — native scroll just works there, this
// hook is a no-op harmless addition in that case.
export function useManualScroll() {
  const touchStartY = useRef(0);

  return {
    onWheel: (e: React.WheelEvent<HTMLDivElement>) => {
      e.currentTarget.scrollTop += e.deltaY;
    },
    onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
      touchStartY.current = e.touches[0].clientY;
    },
    onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => {
      const currentY = e.touches[0].clientY;
      e.currentTarget.scrollTop += touchStartY.current - currentY;
      touchStartY.current = currentY;
    },
  };
}
