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

