"use client";

import { useCallback, useRef } from "react";

/**
 * Returns a ref to attach to a trigger element and a function that keeps
 * focus pinned to it against the admin Dialog's own focus management.
 *
 * Exists specifically for Popover/DropdownMenu triggers inside the admin
 * edit Dialog: closing one of them races against the Dialog's own
 * FocusScope, which reacts to the popover/dropdown content unmounting by
 * repeatedly trying to reclaim focus for its own first field — observed via
 * a focusin/focusout trace as several rapid steal-and-return cycles within
 * roughly 0-90ms of the popover closing, not a single async correction.
 * A fixed set of re-focus attempts at guessed delays (immediate/rAF/60ms/
 * 200ms) couldn't reliably outlast an unknown, variable number of these
 * cycles — one still landed between two scheduled attempts, producing a
 * real, visible flicker onto the Dialog's first field.
 *
 * Instead of guessing delays, watch every focusin on the document for a
 * short window and correct it synchronously, in the same capturing-phase
 * handler, the instant focus lands anywhere but the target — so the wrong
 * element never gets a chance to paint as focused, no matter how many
 * correction cycles the Dialog's FocusScope runs.
 */
export function useReassertFocus<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  const reassertFocus = useCallback(() => {
    const target = ref.current;
    if (!target) return;
    target.focus();

    const onFocusIn = (e: FocusEvent) => {
      if (e.target !== target) {
        target.focus();
      }
    };
    document.addEventListener("focusin", onFocusIn, true);
    window.setTimeout(() => {
      document.removeEventListener("focusin", onFocusIn, true);
    }, 500);
  }, []);

  return { ref, reassertFocus };
}
