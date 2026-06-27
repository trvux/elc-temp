import { ThemeWatcher } from "@/shared/components/layout/user/theme-theme-watcher";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { Toaster } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import Hotjar from "@/shared/components/layout/user/hotjar";
import { cn } from "@/shared/lib/utils";
import { QueryProvider } from "@/shared/providers/query-provider";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn",
  ),
  title: "Điện máy ELC | Máy lạnh, Hệ thống khí tươi & Dự án trọn gói",
  description:
    "Điện máy ELC chuyên cung cấp, lắp đặt & thi công máy lạnh, hệ thống khí tươi chính hãng. Đầy đủ dịch vụ: bảo trì, cho thuê, thu cũ đổi mới uy tín hàng đầu.",
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
      className={cn("h-full antialiased font-sans", "font-sans", inter.variable)}
    >
      <head>


        <link
          rel="preconnect"
          href="https://gdzihzsjfczuggwpykjk.supabase.co"
        />
        <link
          rel="preconnect"
          href="https://media.dienmayelc.com.vn"
        />
        <link
          rel="dns-prefetch"
          href="https://media.dienmayelc.com.vn"
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
        <Hotjar id={process.env.NEXT_PUBLIC_HOTJAR_ID || ""} />


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
