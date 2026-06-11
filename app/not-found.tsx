"use client";

import { Button } from "@/shared/components/ui/button";
import { ArrowLeft, House } from "@phosphor-icons/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-9xl font-bold text-primary/10 tracking-tighter">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            Trang không tồn tại
          </h2>
          <p className="text-muted-foreground">
            Xin lỗi, đường dẫn bạn đang truy cập không tồn tại hoặc đã được di
            chuyển sang địa chỉ mới.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button asChild className="w-full sm:w-auto gap-2">
            <Link href="/">
              <House size={18} />
              Quay về trang chủ
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
            <Link href="/tin-tuc">
              <ArrowLeft size={18} />
              Xem tin tức mới nhất
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
