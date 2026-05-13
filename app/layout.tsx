import { Toaster } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { QueryProvider } from "@/shared/providers/query-provider";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  variable: "--font-inter",
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn"),
  title: "Điện máy ELC | Máy lạnh & Giải pháp không khí chuyên nghiệp, giá tốt",
  description:
    "Điện máy ELC chuyên cung cấp máy lạnh chính hãng, máy lọc không khí và hệ thống điều hòa trung tâm VRV/VRF. Giá tốt nhất, lắp đặt chuyên nghiệp, bảo hành uy tín.",
  openGraph: {
    title: "Điện máy ELC - Máy lạnh chính hãng, giá tốt",
    description: "Giải pháp không khí chuyên nghiệp cho gia đình và doanh nghiệp. Lắp đặt nhanh, bảo hành tận tâm.",
    url: "https://dienmayelc.com.vn",
    siteName: "Điện máy ELC",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Điện máy ELC - Máy lạnh chính hãng, giá tốt",
    description: "Chuyên máy lạnh, hệ thống lọc khí chuyên nghiệp. Giá tốt nhất thị trường.",
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
      className={cn("h-full antialiased", inter.variable)}
    >
      <head>
        <link
          rel="preconnect"
          href="https://gdzihzsjfczuggwpykjk.supabase.co"
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn("min-h-full flex flex-col text-foreground")}
      >
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
