"use client";

import { useMemo, useState } from "react";
import {
  AttributeValue,
  ProductOption,
  ProductVariant,
  ProductWithRelations,
  resolveDeliveryLabel,
  resolveSpecChipLabel,
  toLegacyStockStatusForBadge,
} from "@/modules/catalog/domain";
import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import { Contact } from "@/modules/contact/domain";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { OrderButton } from "@/shared/components/layout/user/order-button";
import { CompareToggleButton } from "@/shared/components/layout/user/compare-toggle-button";
import { StockBadge } from "@/shared/components/ui/stock-badge";
import { TypographyLarge, TypographySmall } from "@/shared/components/ui/typography";
import type { CompareItem } from "@/shared/providers/compare-provider";
import { ZaloProductInfo } from "@/shared/lib/zalo-message";
import { Truck, ShieldCheck } from "@phosphor-icons/react";

interface ProductVariantSwitcherProps {
  product: ProductWithRelations;
  variants: ProductVariant[];
  options: ProductOption[];
  contacts: Contact[];
  compareItem: CompareItem;
  // First few "core" attribute rows (see ProductDetailModule) — rendered as
  // an inline ticker above the price, not their own boxed section.
  highlightSpecs: AttributeValue[];
}

// Everything from here down to the CTAs is one continuous block — a single
// divider separates "what this is" (spec ticker) from "how to get it"
// (price/stock/CTAs), instead of the previous stack of separately bordered
// boxes (specs box, SKU+stock box, delivery box) that read as disconnected
// modules bolted together rather than one designed unit.
export function ProductVariantSwitcher({ product, variants, options, contacts, compareItem, highlightSpecs }: ProductVariantSwitcherProps) {
  // Only variants meant to be independently purchasable — bundle parts
  // (is_standalone=false, e.g. "Dàn lạnh FTKB25") never appear as a
  // selectable option here.
  const sellableVariants = useMemo(() => variants.filter((v) => v.isStandalone), [variants]);
  const defaultVariant = sellableVariants.find((v) => v.isDefault) || sellableVariants[0];

  const [selectedId, setSelectedId] = useState<string | undefined>(defaultVariant?.id);
  const selected = sellableVariants.find((v) => v.id === selectedId) || defaultVariant;

  return (
    <div className="flex flex-col gap-4">
      <SpecTicker specs={highlightSpecs} />

      {sellableVariants.length > 1 && (
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
      )}

      <div className="h-px bg-border" />

      <BuyBox
        variant={selected}
        product={product}
        contacts={contacts}
        compareItem={compareItem}
      />
    </div>
  );
}

// Compact "at a glance" row above the price — badge chips, same visual
// language as the brand/category/tag row right above it, so it reads as a
// continuation of that identity strip rather than its own boxed section.
// Each chip is pre-filtered upstream (ProductDetailModule) to never be
// empty or a hollow "Không" — see resolveSpecChipLabel.
function SpecTicker({ specs }: { specs: AttributeValue[] }) {
  if (specs.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {specs.map((av) => (
        <Badge key={av.id} variant="outline" className="font-medium">
          {resolveSpecChipLabel(av)}
        </Badge>
      ))}
    </div>
  );
}

function BuyBox({
  variant,
  product,
  contacts,
  compareItem,
}: {
  variant?: ProductVariant;
  product: ProductWithRelations;
  contacts: Contact[];
  compareItem: CompareItem;
}) {
  const price = variant?.displayPrice || 0;
  const originalPrice = variant?.originalPrice || 0;
  const discountPercent = variant?.discountPercent || 0;
  const deliveryLabel = resolveDeliveryLabel(variant);
  const warrantyPolicy = product.brand?.warrantyPolicy;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <TypographyLarge className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            <FormattedPrice price={price} />
          </TypographyLarge>
          <StockBadge status={variant ? toLegacyStockStatusForBadge(variant.stockStatus) : undefined} className="text-sm" />
        </div>

        {discountPercent > 0 && (
          <div className="flex items-center gap-2">
            <TypographySmall className="text-muted-foreground">
              <FormattedPrice price={originalPrice} strikethrough />
            </TypographySmall>
            <TypographySmall className="text-destructive">- {discountPercent}%</TypographySmall>
          </div>
        )}

        {variant?.sku && <TypographySmall className="text-muted-foreground">Model: {variant.sku}</TypographySmall>}
      </div>

      {(deliveryLabel || warrantyPolicy) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {deliveryLabel && (
            <span className="flex items-center gap-1.5">
              <Truck className="size-4 shrink-0" />
              {deliveryLabel}
            </span>
          )}
          {warrantyPolicy && (
            <span className="flex items-center gap-1.5 max-w-full">
              <ShieldCheck className="size-4 shrink-0" />
              <span className="line-clamp-1">{warrantyPolicy}</span>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <OrderButton
          className="flex-1 sm:flex-none sm:min-w-56"
          contacts={contacts}
          productInfo={{
            productName: product.name,
            salePrice: price,
            productSlug: product.slug,
          } satisfies ZaloProductInfo}
        />
        <LeadForm
          productId={product.id}
          entityName={product.name}
          entityKind="product"
          triggerLabel="Tư vấn / Báo giá"
          triggerSize="default"
        />
        <CompareToggleButton variant="icon" item={compareItem} />
      </div>
    </div>
  );
}
