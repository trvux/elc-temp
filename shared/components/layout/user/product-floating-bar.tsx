"use client";

import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import { Contact } from "@/modules/contact/domain";
import { Button } from "@/shared/components/ui/button";
import { useProductFloating } from "@/shared/providers/product-floating-provider";
import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ProductFloatingBarProps {
  productName: string;
  salePrice: number;
  originalPrice: number;
  discountPercent: number;
  productImage: string | null;
  contacts: Contact[];
}

export function ProductFloatingBar({
  productName,
  salePrice,
  originalPrice,
  discountPercent,
  productImage,
  contacts,
}: ProductFloatingBarProps) {
  const { setActive } = useProductFloating();
  const [visible, setVisible] = useState(false);

  const zaloContact =
    contacts.find((c) => c.type === "zalo" && c.isActive) ||
    contacts.find((c) => c.type === "zalo") ||
    contacts[0];

  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  useEffect(() => {
    const target = document.getElementById("product-cta-sentinel");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!zaloContact) return null;

  const hasDiscount = discountPercent > 0 && originalPrice > salePrice;

  return (
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
            {/* ── MOBILE: 2 rows ── */}
            <div className="flex flex-col gap-2 md:hidden">
              {/* Row 1: image + name + prices */}
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
              {/* Row 2: full-width CTA */}
              <Button
                size="sm"
                className="w-full shadow-none border-none"
                asChild
              >
                <a
                  href={zaloContact.href}
                  target={zaloContact.isExternal ? "_blank" : undefined}
                  rel={
                    zaloContact.isExternal ? "noopener noreferrer" : undefined
                  }
                >
                  Tư vấn ngay
                </a>
              </Button>
            </div>

            {/* ── TABLET / DESKTOP: 1 row ── */}
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
              <Button size="lg" asChild className="px-10">
                <a
                  href={zaloContact.href}
                  target={zaloContact.isExternal ? "_blank" : undefined}
                  rel={
                    zaloContact.isExternal ? "noopener noreferrer" : undefined
                  }
                >
                  Mua ngay
                </a>
              </Button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
