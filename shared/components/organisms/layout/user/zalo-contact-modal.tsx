"use client";

import { useState } from "react";
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

interface ZaloContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zaloHref: string;
  zaloPhone: string;
  phoneHref?: string;
  phoneNumber?: string;
  // A single product (every existing caller — BuyNowButton, ProductFloatingBar,
  // order-button) or several at once — buildZaloProductsMessage handles
  // both, so callers don't need to branch on count themselves.
  productInfo: ZaloProductInfo | ZaloProductInfo[];
}

export function ZaloContactModal({
  open,
  onOpenChange,
  zaloHref,
  zaloPhone,
  phoneHref,
  phoneNumber,
  productInfo,
}: ZaloContactModalProps) {
  const [copied, setCopied] = useState(false);
  const products = Array.isArray(productInfo) ? productInfo : [productInfo];
  const message = buildZaloProductsMessage(products);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Đã sao chép tin nhắn", {
        description: "Mở Zalo, paste vào cuộc trò chuyện.",
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Không thể sao chép, vui lòng chép thủ công.");
    }
  };

  const handleOpenZaloWeb = () => {
    window.open(zaloHref, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            {/* #0068ff = đúng xanh brand Zalo, cố ý không dùng token app (xem docs/design-system.md §4) */}
            <div className="w-9 h-9 rounded-full bg-[#0068ff] flex items-center justify-center shrink-0">
              <ZaloIcon size={16} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold leading-tight">
                Liên hệ tư vấn qua Zalo
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {products.length > 1 ? `${products.length} sản phẩm đã gợi ý` : products[0].productName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Message preview */}
          <div className="bg-muted/40 rounded-xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line border border-border/40 text-muted-foreground">
            {message}
          </div>

          {/* Primary CTA: Copy message */}
          <Button
            onClick={handleCopyMessage}
            variant={copied ? "secondary" : "default"}
            className="w-full"
            size="default"
          >
            {copied ? "Đã sao chép" : "Sao chép tin nhắn"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Mở Zalo, tìm số{" "}
            <span className="font-medium text-foreground">{zaloPhone}</span>
            {" "}và dán tin nhắn
          </p>

          {/* Phone fallback */}
          {phoneHref && phoneNumber && (
            <>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs">hoặc</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <a
                href={phoneHref}
                className="flex items-center justify-center rounded-lg border border-border/60 bg-background hover:bg-muted/50 transition-colors px-4 py-2.5 text-sm font-semibold text-foreground w-full"
              >
                Gọi {phoneNumber}
              </a>
            </>
          )}

          {/* Fallback: open zalo web */}
          <button
            onClick={handleOpenZaloWeb}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 text-center"
          >
            Mở Zalo Web
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
