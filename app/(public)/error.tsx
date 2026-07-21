"use client";

import { useEffect } from "react";
import { Button } from "@/shared/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PublicError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <h2 className="font-heading text-xl font-semibold">Không thể tải trang</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Đã xảy ra lỗi tạm thời. Vui lòng thử lại sau vài giây.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono">
            #{error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        Thử lại
      </Button>
    </div>
  );
}
