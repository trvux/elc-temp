import type { ProductVariant } from "./types";

function roundPrice(price: number | null | undefined): number {
  if (!price || price <= 0) return 0;
  return Math.round(price / 1000) * 1000;
}

export function formatPrice(price: number | null | undefined): string {
  if (!price || price <= 0) {
    return "Liên hệ";
  }

  const rounded = roundPrice(price);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(rounded);
}

// display_price is the write-time-computed cache (see
// elc-go/docs/product-v2-design.md) reflecting the product's default
// variant — always populated in practice, since every product has >=1
// variant (Product itself carries no price of its own, see the Product doc
// comment in domain/types.ts).
export function resolveProductDisplayPrice(product: {
  displayPrice?: number | null;
}): number {
  return product.displayPrice ?? 0;
}

// Finds the variant that display_price/display_stock_status were computed
// from — needed by callers that display raw variant fields (mpn/sku/gtin)
// rather than the pre-computed display_* cache. Falls back to the first
// variant if defaultVariantId is unset (shouldn't happen for a real
// product, but defensive for a not-yet-saved form state).
export function resolveDefaultVariant(product: {
  defaultVariantId?: string | null;
  variants?: ProductVariant[];
}): ProductVariant | undefined {
  if (!product.variants || product.variants.length === 0) return undefined;
  return (
    product.variants.find((v) => v.id === product.defaultVariantId) ??
    product.variants[0]
  );
}
