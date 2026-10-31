"use client";

// The only interactive bit of the footer: reopens the consent banner. Kept as
// its own tiny client component so the rest of the footer stays a Server
// Component (no JS, no hydration, no props serialized into the page twice).
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("elc:open-consent-banner"))}
      className={className}
    >
      Cài đặt cookie
    </button>
  );
}
