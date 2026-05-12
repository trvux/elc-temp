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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.vn"),
  title: {
    default: "Điện máy ELC | Giải pháp không khí & Nguồn nước chính hãng",
    template: "%s | Điện máy ELC",
  },
  description:
    "Điện máy ELC chuyên cung cấp máy lạnh và giải pháp không khí chuyên nghiệp.",
  openGraph: {
    title: "Điện máy ELC",
    description: "Giải pháp không khí chuyên nghiệp",
    url: "https://dienmayelc.com.vn", // Thay bằng domain thật của bạn
    siteName: "Điện máy ELC",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Điện máy ELC",
    description: "Giải pháp không khí chuyên nghiệp",
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
