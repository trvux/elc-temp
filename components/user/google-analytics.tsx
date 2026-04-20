"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function GoogleAnalytics({ ga_id }: { ga_id: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ga_id) return;

    // Gửi sự kiện page_view thủ công khi chuyển trang trong Next.js (SPA)
    const url = pathname + searchParams.toString();
    window.gtag("config", ga_id, {
      page_path: url,
    });

    // Nếu có tham số q (tìm kiếm), GA4 sẽ tự động bắt trong phần Enhanced Measurement
  }, [pathname, searchParams, ga_id]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${ga_id}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ga_id}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// Khai báo kiểu cho window.gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
