import { ThemeWatcher } from "@/shared/components/layout/user/theme-theme-watcher";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { Toaster } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { QueryProvider } from "@/shared/providers/query-provider";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
// Import component Script của Next.js để tối ưu tốc độ load trang
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn",
  ),
  title: "Điện máy ELC | Máy lạnh & Giải pháp không khí chuyên nghiệp, giá tốt",
  description:
    "Điện máy ELC chuyên cung cấp máy lạnh chính hãng, máy lọc không khí và hệ thống điều hòa trung tâm VRV/VRF. Giá tốt nhất, lắp đặt chuyên nghiệp, bảo hành uy tín.",
  openGraph: {
    title: "Điện máy ELC - Máy lạnh chính hãng, giá tốt",
    description:
      "Giải pháp không khí chuyên nghiệp cho gia đình và doanh nghiệp. Lắp đặt nhanh, bảo hành tận tâm.",
    url: "https://dienmayelc.com.vn",
    siteName: "Điện máy ELC",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Điện máy ELC - Máy lạnh chính hãng, giá tốt",
    description:
      "Chuyên máy lạnh, hệ thống lọc khí chuyên nghiệp. Giá tốt nhất thị trường.",
  },
  alternates: {
    canonical: "https://dienmayelc.com.vn",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("h-full antialiased font-sans", inter.variable)}
    >
      <head>
        {/* Google Tag Manager (Phần script trong head) */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-TQ9DL8CG');
            `,
          }}
        />

        <link
          rel="preconnect"
          href="https://gdzihzsjfczuggwpykjk.supabase.co"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Điện máy ELC",
              url: "https://dienmayelc.com.vn",
              logo: "https://dienmayelc.com.vn/icon.svg",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+84789978898",
                contactType: "customer service",
                areaServed: "VN",
                availableLanguage: "Vietnamese",
              },
              sameAs: [
                "https://www.facebook.com/dienmayelc",
                "https://www.youtube.com/dienmayelc",
              ],
            }),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn("min-h-full flex flex-col text-foreground")}
      >
        {/* Google Tag Manager (noscript - Phần dự phòng ngay đầu body) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TQ9DL8CG"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={true}
            disableTransitionOnChange
          >
            <QueryProvider>
              <ThemeWatcher />
              <Suspense fallback={null}>{children}</Suspense>
              <Toaster position="top-center" richColors />
            </QueryProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
