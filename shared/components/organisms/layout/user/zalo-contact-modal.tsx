"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { buildZaloProductsMessage, ZaloProductInfo } from "@/shared/lib/zalo-message";
import { ZaloIcon } from "@/shared/components/ui/social-icons";
import { toast } from "sonner";
import { trackContactClick } from "@/modules/inquiry";
import type { LeadType, TrackingContext } from "@/modules/inquiry/domain";

interface ZaloContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zaloHref: string;
  zaloPhone: string;
  phoneHref?: string;
  phoneNumber?: string;
  // A single product (every existing caller — BuyNowButton, ProductFloatingBar,
  // order-button) or several at once — buildZaloProductsMessage handles
  // both, so callers don't need to branch on count themselves. Omit when
  // passing `message`/`subtitle` instead (services — ZaloProductInfo's URL
  // shape is hardcoded to /san-pham/, doesn't fit).
  productInfo?: ZaloProductInfo | ZaloProductInfo[];
  // Escape hatch for a non-product entity: caller builds its own message
  // (e.g. buildZaloServiceMessage) and subtitle instead of productInfo.
  // Takes precedence over productInfo when given.
  message?: string;
  subtitle?: string;
  // For the qualify_lead signal only — omitted (no entityId) when
  // productInfo is an array, since there's no single entity to attribute.
  leadType?: LeadType;
  entityId?: string;
  // Service dimensions (slug, line, button) for the same signal.
  trackingContext?: TrackingContext;
}

// Used by the product buttons on desktop (on a phone the app copies the message and
// opens Zalo directly; service buttons do that on every device, without this dialog).
// One goal: send this message to ELC on Zalo. One button copies the text and opens
// Zalo; in Zalo the visitor just pastes and sends. The body is a separate component
// so its state starts fresh every time the dialog opens.
export function ZaloContactModal(props: ZaloContactModalProps) {
  const { open, onOpenChange, subtitle, productInfo } = props;
  const products = productInfo ? (Array.isArray(productInfo) ? productInfo : [productInfo]) : [];
  const description =
    subtitle ?? (products.length > 1 ? `${products.length} sản phẩm đã gợi ý` : products[0]?.productName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            {/* #0068ff = đúng xanh brand Zalo, cố ý không dùng token app (xem docs/design-system.md §4) */}
            <div className="w-9 h-9 rounded-full bg-[#0068ff] flex items-center justify-center shrink-0">
              <ZaloIcon aria-hidden="true" size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="type-label">Gửi yêu cầu qua Zalo</DialogTitle>
              <DialogDescription className="type-legal text-muted-foreground mt-0.5 line-clamp-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ZaloModalBody {...props} />
      </DialogContent>
    </Dialog>
  );
}

function ZaloModalBody({
  onOpenChange,
  zaloHref,
  zaloPhone,
  phoneHref,
  phoneNumber,
  productInfo,
  message: messageOverride,
  subtitle,
  leadType,
  entityId,
  trackingContext,
}: ZaloContactModalProps) {
  const products = productInfo ? (Array.isArray(productInfo) ? productInfo : [productInfo]) : [];
  const text = messageOverride ?? buildZaloProductsMessage(products);
  const [sent, setSent] = useState(false);
  const tracked = useRef(false);

  // Only attributable to a single entity when this modal is about exactly one
  // product/service — an array (multi-product) click can't point at one id.
  const trackableEntityId = Array.isArray(productInfo) ? undefined : entityId;
  const trackableEntityName = Array.isArray(productInfo) ? undefined : (subtitle ?? products[0]?.productName);

  // One qualify_lead per opening, at the first real hand-off (copy or open Zalo);
  // the server also dedups per session. Counting both would report one visitor twice.
  const trackOnce = () => {
    if (tracked.current) return;
    tracked.current = true;
    trackContactClick({
      channel: "zalo",
      leadType,
      entityId: trackableEntityId,
      entityName: trackableEntityName,
      context: trackingContext,
    });
  };

  const copyText = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      toast.error("Không thể sao chép, vui lòng chép thủ công.");
      return false;
    }
  };

  // The main action. window.open runs synchronously inside the click so the
  // browser keeps the user gesture; the copy runs alongside it.
  const handleCopyAndOpen = () => {
    window.open(zaloHref, "_blank", "noopener,noreferrer");
    void copyText().then((ok) => {
      if (ok) setSent(true);
    });
    trackOnce();
  };

  const handlePhoneClick = () => {
    trackContactClick({
      channel: "hotline",
      leadType,
      entityId: trackableEntityId,
      entityName: trackableEntityName,
      context: trackingContext,
    });
  };

  return (
    <div className="px-5 py-5 space-y-5">
      <p
        role="group"
        aria-label="Nội dung tin nhắn sẽ gửi"
        className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 type-body-sm whitespace-pre-line text-muted-foreground"
      >
        {text}
      </p>

      {sent ? (
        <div role="status" className="space-y-3">
          <p className="type-body-sm text-foreground">
            Đã sao chép. Trong Zalo, dán (Ctrl+V) vào cuộc trò chuyện rồi bấm gửi.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCopyAndOpen}>
              Mở lại Zalo
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
          <p className="type-legal text-muted-foreground">
            Nếu Zalo không tự mở đúng cuộc trò chuyện, tìm số{" "}
            <span className="type-tag text-foreground">{zaloPhone}</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Button onClick={handleCopyAndOpen} className="w-full" size="lg">
            Mở Zalo để gửi
          </Button>
          <p className="type-legal text-muted-foreground text-center">
            Nội dung được sao chép sẵn, trong Zalo chỉ cần dán và gửi.
          </p>
        </div>
      )}

      {phoneHref && phoneNumber && (
        <p className="type-legal text-muted-foreground text-center">
          Hoặc gọi{" "}
          <a href={phoneHref} onClick={handlePhoneClick} className="type-tag text-foreground underline underline-offset-2">
            {phoneNumber}
          </a>
        </p>
      )}
    </div>
  );
}
