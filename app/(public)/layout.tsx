import type { Metadata } from "next";
import { Header } from "@/components/user/header";
import { Footer } from "@/components/user/footer";

export const metadata: Metadata = {
  title: "ELC Template",
  description: "Giải pháp thiết kế website chuyên nghiệp",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://elc.vn",
    siteName: "ELC",
    title: "ELC Template",
    description: "Giải pháp thiết kế website chuyên nghiệp",
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
