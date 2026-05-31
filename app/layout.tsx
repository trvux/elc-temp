import { Toaster } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { QueryProvider } from "@/shared/providers/query-provider";
import { ThemeProvider } from "@/shared/components/theme-provider";
import type { Metadata, Viewport } from "next";
import "./globals.css";



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
      className={cn("h-full antialiased font-sans")}
    >
      <head>
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
                telephone: "+84-xxx-xxx-xxx",
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
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster position="top-center" richColors />
            </QueryProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
