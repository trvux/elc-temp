"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Contact } from "@/modules/contact/domain";
import {
  buildZaloProductMessage,
  isMobileDevice,
  ZaloProductInfo,
} from "@/shared/lib/zalo-message";
import { ZaloContactModal } from "@/shared/components/organisms/layout/user/zalo-contact-modal";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

interface OrderButtonProps {
  contacts: Contact[];
  productInfo?: ZaloProductInfo;
  className?: string;
}

export function OrderButton({ contacts, productInfo, className }: OrderButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const zaloContact =
    contacts.find((c) => c.type === "zalo" && c.isActive) ||
    contacts.find((c) => c.type === "zalo") ||
    contacts[0];

  const phoneContact =
    contacts.find((c) => c.type === "phone" && c.isActive) ||
    contacts.find((c) => c.type === "phone");

  if (!zaloContact) return null;

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!productInfo) return;

    if (isMobileDevice()) {
      // Mobile: let the <a href> navigate naturally to Zalo (preserves user gesture).
      // Copy clipboard fire-and-forget - do NOT await (would lose the gesture).
      const message = buildZaloProductMessage(productInfo);
      navigator.clipboard.writeText(message).catch(() => {});
      toast.success("Thông tin sản phẩm đã được sao chép", {
        description: "Paste vào Zalo để gửi cho tư vấn viên.",
        duration: 4000,
      });
      // No e.preventDefault() - let href open Zalo app
    } else {
      e.preventDefault();
      setModalOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="default"
        size="lg"
        className={cn(
          "shadow-[0_0.84px_0.84px_-0.31px_rgba(36,36,36,0.15),0_1.99px_1.99px_-0.625px_rgba(36,36,36,0.15),0_3.63px_3.63px_-0.9375px_rgba(36,36,36,0.15),0_6.04px_6.04px_-1.25px_rgba(36,36,36,0.15),0_9.75px_9.75px_-1.56px_rgba(36,36,36,0.15),0_15.96px_15.96px_-1.875px_rgba(36,36,36,0.15),0_27.48px_27.48px_-2.19px_rgba(36,36,36,0.15),0_50px_50px_-2.5px_rgba(36,36,36,0.15)] border-none",
          className,
        )}
        asChild
      >
        <a
          href={zaloContact.href}
          target={zaloContact.isExternal ? "_blank" : undefined}
          rel={zaloContact.isExternal ? "noopener noreferrer" : undefined}
          onClick={productInfo ? handleClick : undefined}
        >
          Mua ngay
        </a>
      </Button>

      {productInfo && (
        <ZaloContactModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          zaloHref={zaloContact.href}
          zaloPhone={zaloContact.value}
          phoneHref={phoneContact?.href}
          phoneNumber={phoneContact?.value}
          productInfo={productInfo}
        />
      )}
    </>
  );
}
