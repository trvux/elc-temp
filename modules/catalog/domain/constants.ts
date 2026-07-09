export const PRODUCT_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
} as const;

export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];

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

export const PRODUCT_LABELS = {
  NEW: "new",
  HOT: "hot",
  BEST_SELLER: "best_seller",
  SALE: "sale",
} as const;

export type ProductLabel = typeof PRODUCT_LABELS[keyof typeof PRODUCT_LABELS];

export const PRODUCT_CONDITION = {
  NEW: "new",
  USED: "used",
} as const;

export type ProductCondition = typeof PRODUCT_CONDITION[keyof typeof PRODUCT_CONDITION];

export const PRODUCT_CONDITION_MAP: Record<ProductCondition, string> = {
  [PRODUCT_CONDITION.NEW]: "Mới",
  [PRODUCT_CONDITION.USED]: "Cũ",
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

