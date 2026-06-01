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

export const PRODUCT_LABELS = {
  NEW: "new",
  HOT: "hot",
  BEST_SELLER: "best_seller",
  SALE: "sale",
} as const;

export type ProductLabel = typeof PRODUCT_LABELS[keyof typeof PRODUCT_LABELS];

