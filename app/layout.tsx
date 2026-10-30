import { ThemeWatcher } from "@/shared/components/organisms/layout/user/theme-theme-watcher";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { Toaster } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { QueryProvider } from "@/shared/providers/query-provider";
import { BASE_URL } from "@/shared/lib/seo-schema";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

// Same font setup as elc-v2 (the type-scale source): Inter via next/font/google
// (latin + vietnamese subsets so Vietnamese diacritics render in Inter, not a
// fallback) and Geist Mono for code/SKUs. Replaces the self-hosted Inter file
// that was copied from Linear (app/fonts, removed) and two serif/mono fonts
// that no longer had any visible use.
const fontSans = Inter({
  subsets: ["latin", "vietnamese"],
  axes: ["opsz"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  // Title: brand moved to the tail ("| Điện Máy ELC") instead of leading —
  // frees the high-weight leading position for the actual search-intent
  // keywords (mua bán / thi công / dịch vụ / sản phẩm), while still
  // keeping the brand name present for recognition + branded-query CTR.
  // Brand identity for Google itself doesn't depend on this string alone
  // — it's already covered by the domain, openGraph.siteName below, and
  // the Organization JSON-LD schema (see SEOSchema.getOrganization in
  // app/(public)/page.tsx) — so dropping it from the description text
  // entirely (per explicit instruction) doesn't lose that signal.
  // Both strings sit close to Google's practical SERP display budget
  // (~60 chars title, ~155-160 chars description) without padding.
  title: "Mua Bán, Thi Công, Dịch Vụ Máy Lạnh & Khí Tươi | Điện Máy ELC",
  description:
    "Cung cấp máy lạnh, hệ thống cấp khí tươi thu hồi nhiệt Menred, lọc nước chính hãng. Nhận thi công công trình, sửa chữa, bảo trì, vệ sinh máy lạnh.",
  openGraph: {
    title: "Mua Bán, Thi Công, Dịch Vụ Máy Lạnh & Khí Tươi | Điện Máy ELC",
    description:
      "Cung cấp máy lạnh, hệ thống cấp khí tươi thu hồi nhiệt Menred, lọc nước chính hãng. Nhận thi công công trình, sửa chữa, bảo trì, vệ sinh máy lạnh.",
    url: BASE_URL,
    siteName: "Điện máy ELC",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mua Bán, Thi Công, Dịch Vụ Máy Lạnh & Khí Tươi | Điện Máy ELC",
    description:
      "Cung cấp máy lạnh, hệ thống cấp khí tươi thu hồi nhiệt Menred, lọc nước chính hãng. Nhận thi công công trình, sửa chữa, bảo trì, vệ sinh máy lạnh.",
  },
  // Site-wide default: without max-image-preview:large, Google falls back
  // to "standard" preview size — which also caps the image size Google
  // Discover is willing to show for blog/tin-tuc articles, regardless of
  // how large the source image actually is. Pages that need noindex (form,
  // hidden products) already set their own `robots` and fully
  // override this, so this default only reaches indexable pages.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Without this, the keyboard only shrinks the visual viewport, not vh/dvh — fixed sheets scroll past inputs into blank space.
  interactiveWidget: "resizes-content",
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
      className={cn("h-full antialiased font-sans", fontSans.variable, fontMono.variable)}
    >
      <head>
        <link
          rel="preconnect"
          href="https://media.dienmayelc.com.vn"
        />
        <link
          rel="dns-prefetch"
          href="https://media.dienmayelc.com.vn"
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn("min-h-full flex flex-col text-foreground")}
      >
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={true}
            disableTransitionOnChange
          >
            <QueryProvider>
              <ThemeWatcher />
              {children}
              <Toaster position="top-center" richColors />
            </QueryProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
