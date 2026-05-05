import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s \\ ELC Admin",
    default: "ELC Admin",
  },
  description: "Hệ thống quản trị nội dung ELC",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
