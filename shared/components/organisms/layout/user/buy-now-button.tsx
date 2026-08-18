"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { ZaloContactModal } from "@/shared/components/organisms/layout/user/zalo-contact-modal";
import { cn } from "@/shared/lib/utils";
import { buildZaloProductMessage, isMobileDevice, type ZaloProductInfo } from "@/shared/lib/zalo-message";
import { useContacts } from "@/shared/providers/contact-provider";

interface BuyNowButtonProps {
  productName: string;
  productSlug: string;
  salePrice: number;
  className?: string;
}

// This business has no cart/checkout — "Mua ngay" always means "start a
// Zalo conversation with a real salesperson", same flow as the product
// detail page's ProductFloatingBar. Card-level so that flow is one tap
// closer than making the buyer open the detail page first.
export function BuyNowButton({ productName, productSlug, salePrice, className }: BuyNowButtonProps) {
  const contacts = useContacts();
  const [modalOpen, setModalOpen] = useState(false);

  const zaloContact =
    contacts.find((c) => c.type === "zalo" && c.isActive) || contacts.find((c) => c.type === "zalo");
  const phoneContact = contacts.find((c) => c.type === "phone" && c.isActive) || contacts.find((c) => c.type === "phone");

  if (!zaloContact) return null;

  const productInfo: ZaloProductInfo = { productName, salePrice, productSlug };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    if (isMobileDevice()) {
      // Copy fire-and-forget, no preventDefault — let href open the Zalo
      // app natively, which needs the original click gesture to work.
      const message = buildZaloProductMessage(productInfo);
      navigator.clipboard.writeText(message).catch(() => {});
      toast.success("Thông tin sản phẩm đã được sao chép", {
        description: "Paste vào Zalo để gửi cho tư vấn viên.",
        duration: 4000,
      });
    } else {
      e.preventDefault();
      setModalOpen(true);
    }
  };

  return (
    <>
      <Button type="button" size="sm" className={cn(className)} asChild>
        <a href={zaloContact.href} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
          Mua ngay
        </a>
      </Button>

      <ZaloContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        zaloHref={zaloContact.href}
        zaloPhone={zaloContact.value}
        phoneHref={phoneContact?.href}
        phoneNumber={phoneContact?.value}
        productInfo={productInfo}
      />
    </>
  );
}
