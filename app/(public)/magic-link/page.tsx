"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { verifyMagicLinkTokenAction } from "@/modules/auth";

// Token nằm ở URL fragment (#token) — KHÔNG BAO GIỜ ở query string, vì
// fragment không bao giờ được browser gửi lên server (không bị log lại).
function readTokenFromHash(): string | null {
  return window.location.hash.replace(/^#/, "") || null;
}

export default function MagicLinkPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [parsed, setParsed] = useState(false);

  useEffect(() => {
    setToken(readTokenFromHash());
    setParsed(true);
  }, []);

  // verifyMagicLinkTokenAction KHÔNG redirect() server-side — nó chỉ trả
  // {user, error}. Điều hướng theo role làm ở effect bên dưới, phía client.
  const { data, isError, error } = useQuery({
    queryKey: ["verify-magic-link", token],
    queryFn: () => verifyMagicLinkTokenAction(token as string),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data?.user) {
      router.push(data.user.role === "member" ? "/" : "/admin");
      router.refresh();
    }
  }, [data, router]);

  if (parsed && !token) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <p className="text-sm text-muted-foreground">Liên kết không hợp lệ.</p>
      </main>
    );
  }

  if (isError || data?.error) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <p className="text-sm text-muted-foreground">
          Đăng nhập thất bại: {data?.error ?? (error as Error)?.message}. Quay lại{" "}
          <Link href="/" className="underline">
            trang chủ
          </Link>{" "}
          để thử lại.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <p className="text-sm text-muted-foreground">Đang đăng nhập...</p>
    </main>
  );
}
