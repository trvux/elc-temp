import { ProductWithRelations } from "@/modules/catalog/domain";

export const SHOP_NAME = "Điện máy ELC";
export const BASE_URL = "https://dienmayelc.com.vn";

/**
 * Generates SEO-optimized Meta Title and Description to catch all keywords
 */
export function generateProductMetadata(product: ProductWithRelations) {
  if (!product) return {};

  const brandName = product.brand?.name || "";
  const categoryName = product.category?.name || "Máy lạnh";

  // Synonym logic: If it's "Máy lạnh", add "Điều hòa" and vice-versa
  const isAirCon =
    categoryName.toLowerCase().includes("máy lạnh") ||
    categoryName.toLowerCase().includes("điều hòa");
  const synonyms = isAirCon ? "(Điều hòa)" : "";

  // 1. Try to get HP from specs
  const productSpecs = Array.isArray(product.specs) ? (product.specs as any[]) : [];
  let hpSpec = productSpecs.find(
    (s: any) =>
      s.label?.toLowerCase().includes("công suất") ||
      s.label?.toLowerCase().includes("hp"),
  );
  let hpValue = hpSpec?.value || "";

  // 2. Fallback: Try to extract from SKU or Name (e.g., "15hp" or "1.5hp")
  if (!hpValue) {
    const combinedText = `${product.sku} ${product.name}`.toLowerCase();
    const hpMatch = combinedText.match(/(\d+(\.\d+)?)\s*(hp|ngựa|ngua)/) || combinedText.match(/(\d{2})hp/);
    
    if (hpMatch) {
      const val = hpMatch[1];
      // Special case: "15hp" -> "1.5HP"
      if (val === "10") hpValue = "1.0HP";
      else if (val === "15") hpValue = "1.5HP";
      else if (val === "20") hpValue = "2.0HP";
      else if (val === "25") hpValue = "2.5HP";
      else if (val.length === 2 && parseInt(val) > 25) hpValue = `${val}HP`; // e.g. 50HP
      else hpValue = val.includes(".") || val.length === 1 ? `${val}HP` : hpValue;
    }
  }

  // Local terminology mapping pattern: 1HP -> 1 ngựa, 1.5HP -> 1.5 ngựa (1 ngựa rưỡi)
  let hpLocal = "";
  if (hpValue) {
    const numericHP = parseFloat(hpValue.replace(/[^\d.]/g, ""));
    if (!isNaN(numericHP)) {
      const isHalf = numericHP % 1 !== 0;
      if (isHalf) {
        const base = Math.floor(numericHP);
        const halfText = base === 0 ? "nửa ngựa" : `${base} ngựa rưỡi`;
        hpLocal = ` (${numericHP} ngựa - ${halfText})`;
      } else {
        hpLocal = ` (${numericHP} ngựa)`;
      }
    }
  }

  // Clean SKU (main part only)
  const mainSku = product.sku?.split(/[\/\+]/)[0].trim() || "";

  // Strategy: [Category] [Synonym] [Brand] [HP] [SKU] [Tech]
  let title =
    `${categoryName} ${synonyms} ${brandName} ${hpValue} ${mainSku} Inverter`
      .replace(/\s+/g, " ")
      .trim();

  // Always append Shop Name in the module for consistent branding
  if (!title.endsWith(SHOP_NAME)) {
    title += ` | ${SHOP_NAME}`;
  }

  const description =
    `Điện máy ELC - Chuyên cung cấp ${categoryName} ${brandName} ${mainSku} ${hpValue}${hpLocal} chính hãng. Máy lạnh giá tốt nhất thị trường, tiết kiệm điện vượt trội, hỗ trợ thi công lắp đặt máy lạnh chuyên nghiệp. Xem ngay!`
      .replace(/\s+/g, " ")
      .trim();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
      url: `${BASE_URL}/san-pham/${product.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

/**
 * Generates SEO for Category pages
 */
export function generateCategoryMetadata(category: Record<string, unknown> | null | undefined, totalCount: number) {
  if (!category) return {};

  const name = (category.name || "") as string;
  const parent = category.parent as Record<string, unknown> | undefined;
  const parentName = (parent?.name || "") as string;
  const isProject = category.type === "project";

  // Smart name: "Âm trần" + Parent "Máy lạnh" -> "Máy lạnh âm trần"
  let fullName = name;
  if (parentName && !name.toLowerCase().includes(parentName.toLowerCase())) {
    fullName = `${parentName} ${name}`;
  }

  const synonym = fullName.toLowerCase().includes("máy lạnh") ? "Điều hòa" : "";
  const displayName = synonym ? `${fullName} (${synonym})` : fullName;

  let title = "";
  let description = "";

  const metaTitle = (category.metaTitle || category.meta_title) as string | undefined;
  const metaDescription = (category.metaDescription || category.meta_description) as string | undefined;
  const imageUrl = (category.image_url || category.imageUrl) as string | undefined;

  if (isProject) {
    title = `Dự án ${name} tiêu biểu`;
    description = `Khám phá các công trình ${name} thực tế do ELC thực hiện. Giải pháp không khí chuyên nghiệp, thẩm mỹ và bền bỉ. Xem ngay các dự án tiêu biểu!`;
  } else {
    // 1. Use meta_title if provided in DB
    // 2. Fallback to smart generated displayName
    title = metaTitle || `Danh sách ${displayName} chính hãng, giá tốt nhất`;

    if (!metaTitle && (name.toLowerCase().includes("âm trần") || name.toLowerCase().includes("giấu trần"))) {
      title = `Danh sách ${displayName} cho hệ thống VRV/VRF chính hãng`;
    }
    description = metaDescription || `Chuyên cung cấp ${displayName} chính hãng tại Điện máy ELC. Máy lạnh giá tốt nhất thị trường, hỗ trợ thi công lắp đặt máy lạnh chuyên nghiệp, bảo hành uy tín. Xem ngay!`;
  }

  if (!title.endsWith(SHOP_NAME)) {
    title += ` | ${SHOP_NAME}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
      type: "website",
    },
  };
}

/**
 * Generates SEO for Brand pages
 */
export function generateBrandMetadata(brand: Record<string, unknown> | null | undefined, category?: Record<string, unknown> | null | undefined) {
  if (!brand) return {};

  const brandName = (brand.name || "") as string;
  const categoryName = (category?.name || "Máy lạnh") as string;
  
  const synonym = categoryName.toLowerCase().includes("máy lạnh") ? " (Điều hòa)" : "";
  const displayName = `${categoryName}${synonym} ${brandName}`;

  const metaTitle = (brand.metaTitle || brand.meta_title) as string | undefined;
  const metaDescription = (brand.metaDescription || brand.meta_description) as string | undefined;
  const logo = (brand.logoUrl || brand.logo_url) as string | undefined;

  // 1. Use meta_title if provided in DB
  // 2. Fallback to smart generated name
  const title = metaTitle || `${displayName} chính hãng, giá tốt nhất`;
  const description = metaDescription || `Chuyên cung cấp ${displayName} chính hãng tại Điện máy ELC. Cam kết chất lượng cao, bảo hành uy tín, thi công lắp đặt chuyên nghiệp. Xem ngay!`;

  let finalTitle = title;
  if (!finalTitle.endsWith(SHOP_NAME)) {
    finalTitle += ` | ${SHOP_NAME}`;
  }

  return {
    title: finalTitle,
    description,
    openGraph: {
      title: finalTitle,
      description,
      images: logo ? [logo] : [],
      type: "website",
    },
  };
}

/**
 * Generates SEO for Service pages
 */
export function generateServiceMetadata(service: Record<string, unknown> | null | undefined) {
  if (!service) return {};

  const serviceTitle = (service.title || "") as string;
  const image = (service.image || service.image_url) as string | undefined;

  const title = `${serviceTitle} - Dịch vụ chuyên nghiệp | ${SHOP_NAME}`;
  const description = `Cung cấp dịch vụ ${serviceTitle} uy tín, giá tốt tại ${SHOP_NAME}. Đội ngũ kỹ thuật tay nghề cao, thi công nhanh chóng, hỗ trợ 24/7. Click để nhận báo giá chi tiết!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    }
  };
}

/**
 * Generates JSON-LD for Collection pages (Category or Brand) (Price Range)
 * This is what makes Google show "₫4,990,000 to ₫58,640,000"
 */
export function generateCollectionSchema(
  entity: unknown, 
  products: Array<{ salePrice?: number; sale_price?: number; originalPrice?: number; original_price?: number }>
) {
  if (!entity || !products || products.length === 0) return null;

  const prices = products
    .map(p => {
      const salePrice = p.salePrice ?? p.sale_price ?? 0;
      const originalPrice = p.originalPrice ?? p.original_price ?? 0;
      return salePrice || originalPrice || 0;
    })
    .filter(p => p > 0);
  
  if (prices.length === 0) return null;

  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);

  const entityRecord = entity as Record<string, unknown>;
  const entityName = (entityRecord.name || entityRecord.displayName) as string | undefined;
  const entityDesc = (entityRecord.metaDescription || entityRecord.meta_description || entityRecord.description) as string | undefined;

  return {
    "@context": "https://schema.org/",
    "@type": "ItemList",
    "name": entityName,
    "description": entityDesc,
    "url": `${BASE_URL}/san-pham/${entityRecord.slug}`,
    "numberOfItems": products.length,
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": lowPrice,
      "highPrice": highPrice,
      "priceCurrency": "VND",
      "offerCount": products.length
    }
  };
}

/**
 * Generates JSON-LD Structured Data for Google Rich Snippets
 */
export function generateProductSchema(product: ProductWithRelations) {
  const rawProduct = product as unknown as Record<string, unknown>;
  const salePrice = (product.salePrice ?? rawProduct.sale_price ?? 0) as number;
  const originalPrice = (product.originalPrice ?? rawProduct.original_price ?? 0) as number;
  const price = salePrice || originalPrice || 0;
  const hasPrice = price > 0;

  const hasDiscount = hasPrice && 
                      typeof salePrice === "number" && 
                      typeof originalPrice === "number" && 
                      salePrice > 0 && 
                      originalPrice > 0 && 
                      salePrice < originalPrice;

  const stockStatus = (product.stockStatus ?? rawProduct.stock_status) as string | undefined;
  const mpn = (product.mpn ?? rawProduct.mpn) as string | null | undefined;
  const gtin = (product.gtin ?? rawProduct.gtin) as string | null | undefined;
  const hasGtin = typeof gtin === "string" && gtin.trim().length > 0;
  const firstSku = product.sku ? product.sku.split(/[\s/]+/)[0] : "";
  
  // Reuse the smart metadata logic to get the same description
  const metadata = generateProductMetadata(product);

  const brandLogo = product.brand?.logoUrl || (product.brand as unknown as Record<string, unknown> | undefined)?.logo_url;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: Array.isArray(product.images) && product.images.length > 0 
      ? product.images 
      : [],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/san-pham/${product.slug}`,
      "primaryImageOfPage": Array.isArray(product.images) && product.images.length > 0 
        ? product.images[0] 
        : undefined
    },
    description: metadata.description || "",
    sku: firstSku,
    mpn: mpn || undefined,
    gtin: hasGtin ? gtin : undefined,
    "identifier_exists": hasGtin,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || SHOP_NAME,
      logo: (brandLogo || undefined) as string | undefined,
    },
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/san-pham/${product.slug}`,
      priceCurrency: hasPrice ? "VND" : undefined,
      price: hasPrice ? price : undefined,
      priceValidUntil: "2026-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        stockStatus === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      "identifier_exists": hasGtin,
      priceSpecification: hasDiscount ? {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/ListPrice",
        price: originalPrice,
        priceCurrency: "VND",
      } : undefined,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "VND",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "VN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "d",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "VN",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
      seller: {
        "@type": "Organization",
        name: SHOP_NAME,
      },
    },
  };
}
