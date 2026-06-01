import { StockStatus, STOCK_STATUS_MAP } from "./constants";

export function roundPrice(price: number | null | undefined): number {
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

export function normalizeProductPrice(
  originalPriceInput: number | null | undefined,
  salePriceInput: number | null | undefined,
  discountPercentInput: number | null | undefined,
): { originalPrice: number; salePrice: number; discountPercent: number } {
  const originalPrice = originalPriceInput || 0;
  let salePrice = salePriceInput || 0;
  let discountPercent = discountPercentInput || 0;

  // Case 1: If salePrice is missing or equal to original, but we have a discountPercent
  if (
    (salePrice === 0 || salePrice >= originalPrice) &&
    discountPercent > 0 &&
    originalPrice > 0
  ) {
    salePrice = Math.round(originalPrice * (1 - discountPercent / 100));
  }
  // Case 2: If we have a salePrice that is lower than original, calculate accurate percent
  else if (salePrice > 0 && originalPrice > salePrice) {
    discountPercent = Math.round(
      ((originalPrice - salePrice) / originalPrice) * 100,
    );
  }
  // Case 3: If they are equal and no discount, ensure percent is 0
  else if (salePrice === originalPrice || salePrice === 0) {
    discountPercent = 0;
    salePrice = originalPrice;
  }

  return {
    originalPrice,
    salePrice,
    discountPercent,
  };
}
