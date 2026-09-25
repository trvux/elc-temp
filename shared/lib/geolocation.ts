"use client";

// Browser Geolocation API (navigator.geolocation) — a native permission
// prompt separate from cookies/GA4, does NOT need gating behind the
// consent banner (see shared/components/organisms/layout/user/
// consent-banner.tsx). Used to capture where an inquiry/contact-click
// actually came from, reverse-geocoded server-side (shared/lib/geocode.ts)
// into a readable khu-vuc string for staff — GA4's IP-based geo proved
// unreliable in VN (misreported a real Tây Ninh visit as Ho Chi Minh City).

export interface GeoCoords {
  lat: number;
  lng: number;
}

let locationPromise: Promise<GeoCoords | null> | null = null;
let resolvedLocation: GeoCoords | null = null;

// Kicks off the permission prompt (if not already asked this page load)
// and caches whatever it resolves to. Fire-and-forget, safe to call more
// than once (a no-op after the first call). Call this at a moment that
// already signals contact intent — opening ZaloContactModal, mounting the
// inquiry form — not on page load, so the prompt has a clear reason
// attached to it instead of firing at random like cellphones.com.vn does.
export function primeLocation(): void {
  if (locationPromise) return;
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    locationPromise = Promise.resolve(null);
    resolvedLocation = null;
    return;
  }
  locationPromise = new Promise<GeoCoords | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null), // denied, timed out, or unavailable — never blocks the caller
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  });
  locationPromise.then((coords) => {
    resolvedLocation = coords;
  });
}

// Synchronous read of whatever primeLocation() has resolved to so far —
// null if never primed, still pending, denied, or unsupported. Used by
// trackContactClick: navigator.sendBeacon fires synchronously (must
// survive the page navigating to tel:/zalo.me right after), so there's no
// window to await anything there.
export function peekLocation(): GeoCoords | null {
  return resolvedLocation;
}

// Async variant for callers that CAN wait a short beat (the on-site form
// submit isn't beacon-constrained) — races the in-flight request against a
// timeout so a slow or ignored permission prompt never holds up the actual
// submission.
export async function awaitLocation(timeoutMs = 1500): Promise<GeoCoords | null> {
  primeLocation();
  if (resolvedLocation) return resolvedLocation;
  return Promise.race([
    locationPromise as Promise<GeoCoords | null>,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}
