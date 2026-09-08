import { ThemeWatcher } from "@/shared/components/organisms/layout/user/theme-theme-watcher";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { Toaster } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import Hotjar from "@/shared/components/organisms/layout/user/hotjar";
import { cn } from "@/shared/lib/utils";
import { QueryProvider } from "@/shared/providers/query-provider";
import { BASE_URL } from "@/shared/lib/seo-schema";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, JetBrains_Mono, Merriweather } from "next/font/google";
import Script from "next/script";
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
        {/* Google Identity Services — powers the "Continue with Google"
            button on /login (modules/auth/presentation/hooks/useGoogleLogin.ts).
            afterInteractive: not needed for first paint, loads once the page
            is interactive. */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />


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
