"use client";

import { useState } from "react";
import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import { Contact } from "@/modules/contact/domain";
import { Button } from "@/shared/components/ui/button";
import { useProductFloating } from "@/shared/providers/product-floating-provider";
import {
  buildZaloProductMessage,
  isMobileDevice,
  ZaloProductInfo,
} from "@/shared/lib/zalo-message";
import { ZaloContactModal } from "@/shared/components/organisms/layout/user/zalo-contact-modal";
import { WishlistButton } from "@/shared/components/organisms/layout/user/wishlist-button";
import { toast } from "sonner";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import { useEffect } from "react";

interface ProductFloatingBarProps {
  productId: string;
  productName: string;
  salePrice: number;
  originalPrice: number;
  discountPercent: number;
  productImage: string | null;
  productSlug: string;
  contacts: Contact[];
}

export function ProductFloatingBar({
  productId,
  productName,
  salePrice,
  originalPrice,
  discountPercent,
  productImage,
  productSlug,
  contacts,
}: ProductFloatingBarProps) {
  const { setActive } = useProductFloating();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const zaloContact =
    contacts.find((c) => c.type === "zalo" && c.isActive) ||
    contacts.find((c) => c.type === "zalo") ||
    contacts[0];

  const phoneContact =
    contacts.find((c) => c.type === "phone" && c.isActive) ||
    contacts.find((c) => c.type === "phone");

  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  useEffect(() => {
    const target = document.getElementById("product-cta-sentinel");
    if (!target) return;

    // isIntersecting alone can't tell "not scrolled down to it yet" apart
    // from "scrolled back up past it" — both read false. boundingClientRect
    // disambiguates: top < 0 means the sentinel is above the viewport
    // (scrolled past it going down), top > 0 means it's below the viewport
    // (not reached yet, or scrolled back up above it) — only the former
    // should show the bar.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!zaloContact) return null;

  const hasDiscount = discountPercent > 0 && originalPrice > salePrice;

  const productInfo: ZaloProductInfo = {
    productName,
    salePrice,
    productSlug,
  };

  const handleZaloClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobileDevice()) {
      // Mobile: let href navigate naturally (preserves user gesture for Zalo deep link).
      // Copy clipboard fire-and-forget - do NOT await.
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
      <AnimatePresence>
        {visible && (
          <m.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-4 left-0 right-0 z-110 pointer-events-none px-3 md:px-6 lg:px-8"
          >
            <div className="pointer-events-auto mx-auto max-w-4xl bg-background/95 backdrop-blur-md border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl px-3 py-2.5 md:py-1">
              {/* MOBILE: 2 rows */}
              <div className="flex flex-col gap-2 md:hidden">
                <div className="flex items-center gap-2">
                  {productImage && (
                    <div className="shrink-0 w-11 h-11 overflow-hidden">
                      <Image
                        src={productImage}
                        alt={productName}
                        width={44}
                        height={44}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 items-center justify-between gap-2 min-w-0 h-full">
                    <span className="text-sm font-bold leading-tight flex-1">
                      {productName}
                    </span>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-destructive leading-tight">
                        <FormattedPrice price={salePrice} />
                      </div>
                      {hasDiscount && (
                        <div className="text-sm text-muted-foreground line-through leading-tight">
                          <FormattedPrice price={originalPrice} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1 shadow-none border-none"
                    asChild
                  >
                    <a
                      href={zaloContact.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleZaloClick}
                    >
                      Tư vấn ngay
                    </a>
                  </Button>
                  <WishlistButton productId={productId} size="icon-sm" />
                </div>
              </div>

              {/* TABLET / DESKTOP: 1 row */}
              <div className="hidden md:flex items-center gap-4">
                {productImage && (
                  <div className="shrink-0 w-20 h-20 overflow-hidden">
                    <Image
                      src={productImage}
                      alt={productName}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <span className="flex-1 text-md font-bold leading-snug line-clamp-2">
                  {productName}
                </span>
                <div className="shrink-0 text-right">
                  <div className="text-md font-bold text-destructive leading-tight">
                    <FormattedPrice price={salePrice} />
                  </div>
                  {hasDiscount && (
                    <div className="text-sm text-muted-foreground line-through leading-tight">
                      <FormattedPrice price={originalPrice} />
                    </div>
                  )}
                </div>
                <WishlistButton productId={productId} />
                <Button size="lg" asChild className="px-10">
                  <a
                    href={zaloContact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleZaloClick}
                  >
                    Mua ngay
                  </a>
                </Button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

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
