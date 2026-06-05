import { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s \\ ELC Admin",
    default: "ELC Admin",
  },
  description: "Hệ thống quản trị nội dung ELC",
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return <Suspense fallback={null}>{children}</Suspense>;
}

