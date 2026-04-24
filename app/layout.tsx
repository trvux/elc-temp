import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { SEO_CONFIG, generateSchema } from "@/lib/seo";
import GoogleAnalytics from "@/components/user/google-analytics";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  variable: "--font-inter",
  display: "optional",
});

const newsreader = Newsreader({
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dienmayelc.com.vn"),
  title: {
    default: SEO_CONFIG.defaultTitle,
    template: `%s \\ ${SEO_CONFIG.siteName}`,
  },
  description:
    "Điện máy ELC chuyên cung cấp máy lạnh, giải pháp không khí và dịch vụ kỹ thuật điện máy chuyên nghiệp. Uy tín - Tận tâm - Chất lượng.",
  keywords: [
    "điện máy elc",
    "máy lạnh",
    "điều hòa",
    "sửa chữa điện lạnh",
    "lắp đặt máy lạnh",
  ],
  authors: [{ name: "Điện máy ELC" }],
  creator: "Điện máy ELC",
  publisher: "Điện máy ELC",
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  icons: {
    icon: "/logo/favico.svg",
    apple: "/logo/favico.svg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://dienmayelc.com.vn",
    siteName: "Điện máy ELC",
    title: "Điện máy ELC - Giải pháp Không khí thuần khiết",
    description:
      "Giải pháp điều hòa không khí chuyên nghiệp cho gia đình và doanh nghiệp.",
    images: [
      {
        url: "/logo/logo.svg",
        width: 1200,
        height: 630,
        alt: "Điện máy ELC",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("h-full antialiased", inter.variable, newsreader.variable)}
    >
      <head>
        <link
          rel="preconnect"
          href="https://gdzihzsjfczuggwpykjk.supabase.co"
        />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body
        suppressHydrationWarning
        className={cn("min-h-full flex flex-col text-foreground")}
      >
        <Suspense fallback={null}>
          {GA_ID && <GoogleAnalytics ga_id={GA_ID} />}
        </Suspense>
        <TooltipProvider>
          {children}
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
