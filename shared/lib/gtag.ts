// Thin, typed wrapper around window.gtag — every call is a no-op if the GA
// script hasn't loaded (NEXT_PUBLIC_GA_ID unset, or still loading), so
// callers never need to guard on gtag's presence themselves.
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Manual, single source of truth for pageviews — the init script below sets
// `send_page_view: false` specifically so GA's own automatic pageview on
// script load never fires alongside this one. The previous implementation
// had both active at once and double-counted every first pageview.
export function pageview(pagePath: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_TRACKING_ID, { page_path: pagePath });
}

// GA4's own recommended-event names (view_item, generate_lead, ...) — see
// modules/event/domain/types.ts, which uses the identical vocabulary for
// our own internal pipeline so both systems describe the same funnel the
// same way.
export function event(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
