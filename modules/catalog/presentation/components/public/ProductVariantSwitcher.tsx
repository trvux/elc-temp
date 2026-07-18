"use client";

import { useMemo, useState } from "react";
import {
  formatPrice,
  ProductOption,
  ProductVariant,
  ProductWithRelations,
  toLegacyStockStatusForBadge,
} from "@/modules/catalog/domain";
import { Contact } from "@/modules/contact/domain";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import { Button } from "@/shared/components/ui/button";
import { OrderButton } from "@/shared/components/layout/user/order-button";
import { CompareToggleButton } from "@/shared/components/layout/user/compare-toggle-button";
import { StockBadge } from "@/shared/components/ui/stock-badge";
import { TypographyLarge, TypographySmall } from "@/shared/components/ui/typography";
import type { CompareItem } from "@/shared/providers/compare-provider";
import { ZaloProductInfo } from "@/shared/lib/zalo-message";
import { cn } from "@/shared/lib/utils";

interface ProductVariantSwitcherProps {
  product: ProductWithRelations;
  variants: ProductVariant[];
  options: ProductOption[];
  contacts: Contact[];
  compareItem: CompareItem;
}

export function ProductVariantSwitcher({ product, variants, options, contacts, compareItem }: ProductVariantSwitcherProps) {
  // Only variants meant to be independently purchasable — bundle parts
  // (is_standalone=false, e.g. "Dàn lạnh FTKB25") never appear as a
  // selectable option here.
  const sellableVariants = useMemo(() => variants.filter((v) => v.isStandalone), [variants]);
  const defaultVariant = sellableVariants.find((v) => v.isDefault) || sellableVariants[0];

  const [selectedId, setSelectedId] = useState<string | undefined>(defaultVariant?.id);
  const selected = sellableVariants.find((v) => v.id === selectedId) || defaultVariant;

  if (sellableVariants.length <= 1) {
    // No real choice to make — render the single (default) variant's own
    // fields directly, no product-level fallback needed since Product no
    // longer carries sku/price/stock of its own.
    return (
      <>
        <div className="flex flex-col gap-3">
          {defaultVariant?.sku && <TypographySmall>Mã sản phẩm (SKU): {defaultVariant.sku}</TypographySmall>}
          <StockBadge status={defaultVariant ? toLegacyStockStatusForBadge(defaultVariant.stockStatus) : undefined} className="text-sm" />
        </div>
        <PriceBlock price={defaultVariant?.displayPrice || 0} originalPrice={defaultVariant?.originalPrice || 0} discountPercent={defaultVariant?.discountPercent || 0} />
        <Ctas product={product} contacts={contacts} price={defaultVariant?.displayPrice || 0} compareItem={compareItem} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {options.map((opt) => (
          <div key={opt.id} className="flex flex-col gap-2">
            <TypographySmall className="text-muted-foreground">{opt.name}</TypographySmall>
            <div className="flex flex-wrap gap-2">
              {opt.values.map((val) => {
                const matchingVariant = sellableVariants.find((v) => v.optionValueIds.includes(val.id));
                const isSelectedValue = selected?.optionValueIds.includes(val.id);
                return (
                  <Button
                    key={val.id}
                    type="button"
                    variant={isSelectedValue ? "default" : "outline"}
                    size="sm"
                    disabled={!matchingVariant}
                    onClick={() => matchingVariant && setSelectedId(matchingVariant.id)}
                  >
                    {val.value}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {selected?.sku && <TypographySmall>Mã sản phẩm (SKU): {selected.sku}</TypographySmall>}
        <StockBadge status={selected ? toLegacyStockStatusForBadge(selected.stockStatus) : undefined} className="text-sm" />
      </div>

      <PriceBlock
        price={selected?.displayPrice || 0}
        originalPrice={selected?.originalPrice || 0}
        discountPercent={selected?.discountPercent || 0}
      />

      <Ctas product={product} contacts={contacts} price={selected?.displayPrice || 0} compareItem={compareItem} />
    </>
  );
}

function PriceBlock({ price, originalPrice, discountPercent }: { price: number; originalPrice: number; discountPercent: number }) {
  return (
    <div className="space-y-2">
      <TypographyLarge className={cn("text-3xl md:text-4xl font-bold text-foreground tracking-tight")}>
        {formatPrice(price).replace(/\s?₫$/, "đ")}
      </TypographyLarge>
      {discountPercent > 0 && (
        <div className="flex items-center gap-2">
          <TypographySmall className="text-md text-muted-foreground line-through">
            {formatPrice(originalPrice).replace(/\s?₫$/, "đ")}
          </TypographySmall>
          <TypographySmall className="text-destructive">- {discountPercent}%</TypographySmall>
        </div>
      )}
    </div>
  );
}

function Ctas({ product, contacts, price, compareItem }: { product: ProductWithRelations; contacts: Contact[]; price: number; compareItem: CompareItem }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <OrderButton
        contacts={contacts}
        productInfo={{
          productName: product.name,
          salePrice: price,
          productSlug: product.slug,
        } satisfies ZaloProductInfo}
      />
      <LeadForm productId={product.id} entityName={product.name} entityKind="product" />
      <CompareToggleButton item={compareItem} />
    </div>
  );
}
