"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import * as gtag from "@/shared/lib/gtag";

// Renders nothing if NEXT_PUBLIC_GA_ID isn't set — GA is opt-in parallel
// tracking alongside our own DB-backed pipeline (see modules/event), not a
// replacement for it.
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!gtag.GA_TRACKING_ID || !pathname) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    gtag.pageview(url);
  }, [pathname, searchParams]);

  if (!gtag.GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            // send_page_view: false — the useEffect above is the only
            // pageview source. Letting this config call ALSO auto-fire one
            // double-counts every first pageview (the previous
            // implementation's bug, see commit history).
            gtag('config', '${gtag.GA_TRACKING_ID}', { send_page_view: false });
          `,
        }}
      />
    </>
  );
}
