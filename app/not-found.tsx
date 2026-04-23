"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream px-6 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-9xl font-bold text-primary/10 tracking-tighter">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-primary">Trang không tồn tại</h2>
          <p className="text-muted-foreground">
            Xin lỗi, đường dẫn bạn đang truy cập không tồn tại hoặc đã được di chuyển sang địa chỉ mới.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/">
            <Button className="w-full sm:w-auto gap-2">
              <Home size={18} />
              Quay về trang chủ
            </Button>
          </Link>
          <Link href="/tin-tuc">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <ArrowLeft size={18} />
              Xem tin tức mới nhất
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
