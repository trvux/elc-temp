"use client";

import { ArrowsClockwise, Pause, Play } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/shared/components/ui/button";

interface Props {
  updatedAtIso: string;
  updatedAtLabel: string;
  intervalSeconds?: number;
}

// The page re-fetches itself so a manager can leave it open. Anything that
// updates on its own must be pausable (WCAG 2.2.2), so there is a visible
// pause/resume button, a manual refresh, and refreshing stops while the tab is
// hidden so it doesn't burn requests in the background.
export function AutoRefresh({ updatedAtIso, updatedAtLabel, intervalSeconds = 30 }: Props) {
  const router = useRouter();
  const [auto, setAuto] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    }, intervalSeconds * 1000);
    return () => window.clearInterval(id);
  }, [auto, intervalSeconds, router]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Cập nhật lúc <time dateTime={updatedAtIso}>{updatedAtLabel}</time>
        {auto ? ` (tự làm mới mỗi ${intervalSeconds} giây)` : " (đã tạm dừng tự làm mới)"}
      </p>
      <Button type="button" variant="outline" className="min-h-11" aria-busy={pending} onClick={() => startTransition(() => router.refresh())}>
        <ArrowsClockwise aria-hidden="true" />
        Làm mới ngay
      </Button>
      <Button type="button" variant="outline" className="min-h-11" aria-pressed={!auto} onClick={() => setAuto((v) => !v)}>
        {auto ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        {auto ? "Tạm dừng tự làm mới" : "Bật tự làm mới"}
      </Button>
    </div>
  );
}
