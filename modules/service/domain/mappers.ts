import { ServiceWithRelations } from "./types";
import { formatCurrency } from "@/shared/lib/utils";
import { primaryImageUrl } from "@/shared/lib/image-asset";

export interface ServiceCardData {
  title: string;
  price: string;
  image: string;
  description: string;
  badges: string[];
  slug: string;
}

export function mapServiceToCardData(service: ServiceWithRelations): ServiceCardData {
  let price = "";
  if (service.priceDisplayText) {
    price = service.priceDisplayText;
  } else if (service.originalPrice !== null && service.originalPrice !== undefined) {
    const discount = service.discountPercent;
    const hasDiscount = discount !== null && discount !== undefined && discount > 0;
    const finalPrice = hasDiscount
      ? service.originalPrice - Math.round(service.originalPrice * (discount / 100))
      : service.originalPrice;
    price = formatCurrency(finalPrice).replace(/\s?₫/g, " đ");
  }

  return {
    title: service.title,
    price,
    image: primaryImageUrl(service.images) || "/placeholder.png",
    description: service.description || "",
    badges: service.labels || [],
    slug: service.slug,
  };
}
