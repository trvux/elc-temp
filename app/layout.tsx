import { ThemeWatcher } from "@/shared/components/organisms/layout/user/theme-theme-watcher";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { Toaster } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import GoogleAnalytics from "@/shared/components/molecules/analytics/GoogleAnalytics";
import Hotjar from "@/shared/components/organisms/layout/user/hotjar";
import { cn } from "@/shared/lib/utils";
import { QueryProvider } from "@/shared/providers/query-provider";
import { BASE_URL } from "@/shared/lib/seo-schema";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, JetBrains_Mono, Merriweather } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const merriweatherHeading = Merriweather({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

// Inter/Merriweather above already cover typeset's --typeset-font-body/
// --typeset-font-heading (site already uses them as --font-sans/--font-heading,
// see .typeset-docs in globals.css) — no need to load a second instance under
// a different variable name. Geist Mono is genuinely new: the site's own
// --font-mono is JetBrains Mono, but shadcn/typeset's reference design uses
// Geist Mono specifically for its code blocks, so it gets its own variable
// scoped to typeset content only.
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Điện máy ELC | Máy lạnh, Hệ thống khí tươi & Dự án trọn gói",
  description:
    "Điện máy ELC chuyên cung cấp, lắp đặt & thi công máy lạnh, hệ thống khí tươi chính hãng. Đầy đủ dịch vụ: bảo trì, cho thuê, thu cũ đổi mới uy tín hàng đầu.",
  openGraph: {
    title: "Điện máy ELC - Máy lạnh chính hãng, giá tốt",
    description:
      "Giải pháp không khí chuyên nghiệp cho gia đình và doanh nghiệp. Lắp đặt nhanh, bảo hành tận tâm.",
    url: BASE_URL,
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
      className={cn("h-full antialiased font-sans", "font-sans", inter.variable, merriweatherHeading.variable, jetbrainsMono.variable, geistMono.variable)}
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
        <Hotjar id={process.env.NEXT_PUBLIC_HOTJAR_ID || ""} />
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>


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
