// Mirrors elc-go's domain.ProductStatus — a draft is submitted for review,
// an owner/admin approves it to published or rejects it back to draft (with
// a reason), and a published product can later be archived (discontinued
// but its URL kept alive). See elc-go/internal/product/domain/types.go.
export const PRODUCT_STATUS = {
  DRAFT: "draft",
  PROPOSED: "proposed",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];

export const PRODUCT_STATUS_MAP: Record<ProductStatus, string> = {
  [PRODUCT_STATUS.DRAFT]: "Nháp",
  [PRODUCT_STATUS.PROPOSED]: "Chờ duyệt",
  [PRODUCT_STATUS.PUBLISHED]: "Đang hiển thị",
  [PRODUCT_STATUS.ARCHIVED]: "Ngừng bán",
};

export const STOCK_STATUS = {
  IN_STOCK: "in_stock",
  OUT_OF_STOCK: "out_of_stock",
  PRE_ORDER: "pre_order",
  DISCONTINUED: "discontinued",
} as const;

export type StockStatus = typeof STOCK_STATUS[keyof typeof STOCK_STATUS];

export const STOCK_STATUS_MAP: Record<string, string> = {
  [STOCK_STATUS.IN_STOCK]: "Còn hàng",
  [STOCK_STATUS.OUT_OF_STOCK]: "Hết hàng",
  [STOCK_STATUS.PRE_ORDER]: "Đặt trước",
  [STOCK_STATUS.DISCONTINUED]: "Ngưng sản xuất",
};

// Variant-level stock status (elc-go's product_variant_stock_status enum) —
// deliberately different values from the legacy product-level STOCK_STATUS
// above (out_of_stock/pre_order don't exist here). Reflects how this
// business actually fulfills orders: in stock at the one showroom, or
// ordered from a supplier on demand — not a multi-warehouse restock signal.
// See elc-go/docs/product-v2-design.md "Explicitly out of scope".
export const VARIANT_STOCK_STATUS = {
  IN_STOCK: "in_stock",
  ORDER_FROM_SUPPLIER: "order_from_supplier",
  DISCONTINUED: "discontinued",
} as const;

export type VariantStockStatus = typeof VARIANT_STOCK_STATUS[keyof typeof VARIANT_STOCK_STATUS];

export const VARIANT_STOCK_STATUS_MAP: Record<VariantStockStatus, string> = {
  [VARIANT_STOCK_STATUS.IN_STOCK]: "Còn hàng",
  [VARIANT_STOCK_STATUS.ORDER_FROM_SUPPLIER]: "Đặt hàng từ NCC",
  [VARIANT_STOCK_STATUS.DISCONTINUED]: "Ngưng kinh doanh",
};

// `<StockBadge>` (shared/components/ui/stock-badge.tsx) only understands the
// legacy product-level STOCK_STATUS values — it silently renders nothing for
// anything not in STOCK_STATUS_MAP. Public listing components reading the
// new `displayStockStatus` cache field (or a variant's own stockStatus
// directly) need this translation first. order_from_supplier reads to a
// customer the same as "đặt trước" (pre-order), so it maps there; every
// other value already matches a legacy one 1:1.
export function toLegacyStockStatusForBadge(status: string | null | undefined): StockStatus | undefined {
  if (!status) return undefined;
  if (status === VARIANT_STOCK_STATUS.ORDER_FROM_SUPPLIER) return STOCK_STATUS.PRE_ORDER;
  return status as StockStatus;
}

// Shared by ProductCard and ProductVariantSwitcher — a delivery claim only
// while actually in stock (a supplier/pre-order item's own stock badge
// already says "Đặt trước", a delivery-days claim there would contradict
// it), using the real lead-time estimate when we have one.
export function resolveDeliveryLabel(variant?: {
  stockStatus?: string | null;
  leadTimeDays?: number | null;
} | null): string | null {
  if (!variant || variant.stockStatus !== VARIANT_STOCK_STATUS.IN_STOCK) return null;
  return variant.leadTimeDays && variant.leadTimeDays > 0
    ? `Giao trong ${variant.leadTimeDays} ngày`
    : "Giao nhanh";
}

