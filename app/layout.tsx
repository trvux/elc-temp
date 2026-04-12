import type { Metadata } from "next";
import { Inter, Crimson_Pro, Newsreader } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "optional",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-crimson-pro",
  display: "optional",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "optional",
});

export const metadata: Metadata = {
  title: "Điện máy ELC",
  description: "Điện máy ELC",
  icons: {
    icon: "/favicon.ico?v=4",
  },
  openGraph: {
    type: "website",
    siteName: "Điện máy ELC",
    title: "Điện máy ELC",
    description: "Điện máy ELC - Giải pháp Không khí thuần khiết",
  },
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
      className={cn(
        "h-full antialiased",
        inter.variable,
        crimsonPro.variable,
        newsreader.variable,
      )}
    >
      <head>
        <link rel="preconnect" href="https://gdzihzsjfczuggwpykjk.supabase.co" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-full flex flex-col text-foreground",
          inter.className,
        )}
      >
        <TooltipProvider>
          {children}
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
