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
  // Switch mặc định TẮT (khác CellphoneS để mặc định BẬT cả 3) — đúng
  // chuẩn opt-in của Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, chỉ bật khi
  // khách tự tay bật.
  const [draft, setDraft] = useState<ConsentState>(
    initialConsent ?? { analytics: "denied", ads: "denied" },
  );

  useEffect(() => {
    if (!visible) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  useEffect(() => {
    const reopen = () => {
      setDraft(readConsentCookie() ?? { analytics: "denied", ads: "denied" });
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
    setTimeout(() => setVisible(false), 300);
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
            Cookie được sử dụng để website hoạt động ổn định và ghi nhận sản phẩm/dịch vụ bạn
            đang quan tâm, hỗ trợ tư vấn phù hợp hơn. Xem chi tiết tại{" "}
            <Link
              href="/chinh-sach-thu-thap-va-xu-ly-du-lieu-ca-nhan"
              className="underline underline-offset-2 hover:text-foreground"
            >
              chính sách thu thập và xử lý dữ liệu cá nhân
            </Link>
            .
          </CardDescription>

          <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Phân tích &amp; đo lường lượt truy cập</span>
              <Switch
                checked={draft.analytics === "granted"}
                onCheckedChange={(checked) =>
                  setDraft((d) => ({ ...d, analytics: checked ? "granted" : "denied" }))
                }
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Quảng cáo phù hợp với bạn</span>
              <Switch
                checked={draft.ads === "granted"}
                onCheckedChange={(checked) =>
                  setDraft((d) => ({ ...d, ads: checked ? "granted" : "denied" }))
                }
              />
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => commit({ analytics: "denied", ads: "denied" })}
          >
            Từ chối
          </Button>
          <Button className="flex-1" onClick={() => commit(draft)}>
            Lưu lựa chọn
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
