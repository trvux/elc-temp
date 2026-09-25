"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CookieIcon } from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/shared/components/ui/card";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_COOKIE_MAX_AGE,
  ConsentState,
  parseConsentCookie,
  serializeConsentCookie,
  toGtagConsentPayload,
} from "@/shared/lib/consent";

// Sự kiện footer dùng để mở lại banner (mục "Cài đặt cookie") kể cả khi
// khách đã chọn từ trước — không cần Context/Provider riêng cho 1 tín hiệu
// đơn giản như thế này.
const REOPEN_EVENT = "elc:open-consent-banner";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function readConsentCookie(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`));
  return parseConsentCookie(match?.[1]);
}

function writeConsentCookie(state: ConsentState) {
  document.cookie = `${CONSENT_COOKIE_NAME}=${serializeConsentCookie(state)}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}`;
}

function pushConsentUpdate(state: ConsentState) {
  // window.gtag đã được định nghĩa bởi script inline trong
  // app/(public)/layout.tsx (chạy trước khi GTM load) — xem shared/lib/consent.ts.
  window.gtag?.("consent", "update", toGtagConsentPayload(state));
}

interface ConsentBannerProps {
  initialConsent: ConsentState | null;
}

export function ConsentBanner({ initialConsent }: ConsentBannerProps) {
  const [visible, setVisible] = useState(initialConsent === null);
  // Tách "mounted" khỏi "visible": render ở trạng thái ẩn (translate-y-full)
  // trước, rồi 1 tick sau mới bật animate lên — có card trượt lên mượt thay
  // vì bật thẳng full opacity ngay khung hình đầu (SSR/hydration-safe, không
  // đổi kết quả animate dựa trên state server không biết được).
  const [entered, setEntered] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(
    initialConsent ?? { analytics: "granted", ads: "granted" },
  );

  useEffect(() => {
    if (!visible) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  useEffect(() => {
    const reopen = () => {
      setDraft(readConsentCookie() ?? { analytics: "granted", ads: "granted" });
      setCustomizing(false);
      setEntered(false);
      setVisible(true);
    };
    window.addEventListener(REOPEN_EVENT, reopen);
    return () => window.removeEventListener(REOPEN_EVENT, reopen);
  }, []);

  const commit = (state: ConsentState) => {
    writeConsentCookie(state);
    pushConsentUpdate(state);
    setEntered(false);
    setTimeout(() => {
      setVisible(false);
      setCustomizing(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 w-full transition-all duration-300 ease-out sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm ${
        entered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 sm:translate-y-4"
      }`}
    >
      <Card className="rounded-b-none border-b-0 shadow-xl sm:rounded-b-xl sm:border-b">
        <CardHeader className="flex-row items-center gap-2.5 space-y-0">
          <CookieIcon size={22} weight="duotone" className="shrink-0 text-primary" />
          <CardTitle className="text-base">Website dùng cookie</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <CardDescription className="text-sm leading-relaxed">
            Bọn mình dùng cookie để website hoạt động ổn định, đo lường lượt truy cập và cải
            thiện trải nghiệm mua sắm. Xem chi tiết tại{" "}
            <Link href="/thong-tin" className="underline underline-offset-2 hover:text-foreground">
              trang thông tin công ty
            </Link>
            .
          </CardDescription>

          {customizing && (
            <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Phân tích &amp; đo lường (GA4)</span>
                <Switch
                  checked={draft.analytics === "granted"}
                  onCheckedChange={(checked) =>
                    setDraft((d) => ({ ...d, analytics: checked ? "granted" : "denied" }))
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Quảng cáo (Google Ads)</span>
                <Switch
                  checked={draft.ads === "granted"}
                  onCheckedChange={(checked) =>
                    setDraft((d) => ({ ...d, ads: checked ? "granted" : "denied" }))
                  }
                />
              </label>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {customizing ? (
            <Button className="w-full" onClick={() => commit(draft)}>
              Lưu lựa chọn
            </Button>
          ) : (
            <Button className="w-full" onClick={() => commit({ analytics: "granted", ads: "granted" })}>
              Đồng ý tất cả
            </Button>
          )}
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => commit({ analytics: "denied", ads: "denied" })}
            >
              Từ chối
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setCustomizing((v) => !v)}
            >
              {customizing ? "Ẩn tuỳ chỉnh" : "Tuỳ chỉnh"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
