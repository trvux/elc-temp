// GTM (GTM-TQ9DL8CG) is the only tracking loader on this site — no gtag.js
// script is ever loaded (see docs/fix-ga4-conversion-tracking-dark.md), so
// events go straight to the dataLayer GTM already reads from, instead of a
// window.gtag() that never exists.
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// GA4's own recommended-event names (view_item, generate_lead, ...) — see
// modules/event/domain/types.ts, which uses the identical vocabulary for
// our own internal pipeline so both systems describe the same funnel the
// same way. Corresponding triggers/tags for these events must exist in the
// GTM container for them to actually reach GA4.
export function event(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}
