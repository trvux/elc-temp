"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import * as gtag from "@/shared/lib/gtag";
import { trackPageView, trackEvent } from "@/shared/lib/tracking";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      // Nếu vào trang admin, đánh dấu là nhân viên nội bộ
      if (pathname.startsWith("/admin")) {
        localStorage.setItem("elc_internal_user", "true");
      }

      // Chỉ track nếu KHÔNG phải là nhân viên nội bộ
      const isInternal = localStorage.getItem("elc_internal_user") === "true";
      
      if (!isInternal) {
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
        trackPageView(url);
      }
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    let scrolled50 = false;
    let scrolled90 = false;

    const handleScroll = () => {
      // Bỏ qua nếu là nhân viên
      if (localStorage.getItem("elc_internal_user") === "true") return;

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPos = window.scrollY;
      const scrollPercent = (scrollPos / scrollHeight) * 100;

      if (scrollPercent >= 50 && !scrolled50) {
        trackEvent({ action: "scroll_50", category: "engagement", label: "Scrolled 50%" });
        scrolled50 = true;
      }
      if (scrollPercent >= 90 && !scrolled90) {
        trackEvent({ action: "scroll_90", category: "engagement", label: "Scrolled 90%" });
        scrolled90 = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

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
            gtag('config', '${gtag.GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
