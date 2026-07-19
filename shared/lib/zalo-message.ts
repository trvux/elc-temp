import { BASE_URL as SITE_URL } from "@/shared/lib/seo-schema";

export interface ZaloProductInfo {
  productName: string;
  salePrice: number;
  productSlug: string;
}

/**
 * Build a pre-formatted Zalo message for a product inquiry.
 * Zalo does not support URL query params to pre-fill messages.
 */
export function buildZaloProductMessage(info: ZaloProductInfo): string {
  // Mirrors formatPrice's "Liên hệ" fallback (modules/catalog/domain/price.ts)
  // — a product with no display price would otherwise read as "Giá: 0 ₫".
  const formattedPrice =
    info.salePrice > 0
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(info.salePrice)
      : "Liên hệ";

  const productUrl = `${SITE_URL}/san-pham/${info.productSlug}`;

  return `Chào shop, tôi muốn tư vấn về sản phẩm:\n${info.productName}\nGiá: ${formattedPrice}\nLink: ${productUrl}`;
}

/**
 * Detect if the current device is mobile/tablet.
 * On mobile, zalo.me deep link opens the Zalo app directly.
 * On desktop, it redirects to Zalo web login page - bad UX.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

