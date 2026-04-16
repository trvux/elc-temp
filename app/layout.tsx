import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
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
  title: "Điện máy ELC",
  description: "Điện máy ELC",
  icons: {
    icon: "/favicon.ico",
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
        <TooltipProvider>
          {children}
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
