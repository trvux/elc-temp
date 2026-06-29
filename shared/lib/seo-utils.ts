import { ProductWithRelations } from "@/modules/catalog/domain";
import { Branch } from "@/modules/branch/domain";
import { SEOSchema, parseAddress, formatPhone, BASE_URL } from "./seo-schema";
import type { Metadata } from "next";
import { District } from "./districts";

export const SHOP_NAME = "Điện máy ELC";
export { BASE_URL, parseAddress, formatPhone, SEOSchema };

export function sanitizeAndFormatTitle(title: string | null | undefined, isHomepage: boolean = false): string {
  if (!title) return SHOP_NAME;
  
  let cleaned = title;
  
  // 1. Remove all instances of "Điện máy ELC" accompanied by "|"
  cleaned = cleaned.replace(/\s*\|\s*Điện máy ELC\s*/gi, " ");
  cleaned = cleaned.replace(/\s*Điện máy ELC\s*\|\s*/gi, " ");
  
  // Clean up any double pipes or leftovers
  cleaned = cleaned.replace(/\s*\|\s*\|\s*/g, " | ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  if (cleaned.startsWith("|")) cleaned = cleaned.substring(1).trim();
  if (cleaned.endsWith("|")) cleaned = cleaned.substring(0, cleaned.length - 1).trim();
  
  if (!cleaned) return SHOP_NAME;

  if (isHomepage) {
    if (cleaned.toLowerCase().startsWith(SHOP_NAME.toLowerCase())) {
      return cleaned;
    }
    return `${SHOP_NAME} | ${cleaned}`;
  } else {
    return `${cleaned} | ${SHOP_NAME}`;
  }
}

export function appendLocationToTitle(title: string, location?: District): string {
  if (!location) return title;
  const suffix = ` | ${SHOP_NAME}`;
  const base = title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
  return `${base} tại ${location.name} | ${SHOP_NAME}`;
}

export function appendLocationToDescription(description: string, location?: District): string {
  if (!location) return description;
  if (description.endsWith("Xem ngay!")) {
    return description.replace("Xem ngay!", `tại ${location.name}. Xem ngay!`);
  }
  if (description.endsWith("Click để nhận báo giá chi tiết!")) {
    return description.replace("Click để nhận báo giá chi tiết!", `tại ${location.name}. Click để nhận báo giá chi tiết!`);
  }
  return `${description} Hỗ trợ nhanh tại ${location.name}.`;
}

/**
 * Generates SEO-optimized Meta Title and Description to catch all keywords
 */
export function generateProductMetadata(product: ProductWithRelations, location?: District): Metadata {
  if (!product) return {};

  const brandName = product.brand?.name || "";
  const categoryName = product.category?.name || "Máy lạnh";

  // Synonym logic: If it's "Máy lạnh", add "Điều hòa" and vice-versa
  const isAirCon =
    categoryName.toLowerCase().includes("máy lạnh") ||
    categoryName.toLowerCase().includes("điều hòa");
  const synonyms = isAirCon ? "(Điều hòa)" : "";

  // 1. Try to get HP from specs
  interface Spec {
    label?: string;
    value?: string;
  }

  const productSpecs = Array.isArray(product.specs)
    ? (product.specs as unknown as Spec[])
    : [];
  const hpSpec = productSpecs.find(
    (s) =>
      s.label?.toLowerCase().includes("công suất") ||
      s.label?.toLowerCase().includes("hp"),
  );
  let hpValue = hpSpec?.value || "";

  // 2. Fallback: Try to extract from SKU or Name (e.g., "15hp" or "1.5hp")
  if (!hpValue) {
    const combinedText = `${product.sku} ${product.name}`.toLowerCase();
    const hpMatch =
      combinedText.match(/(\d+(\.\d+)?)\s*(hp|ngựa|ngua)/) ||
      combinedText.match(/(\d{2})hp/);

    if (hpMatch) {
      const val = hpMatch[1];
      // Special case: "15hp" -> "1.5HP"
      if (val === "10") hpValue = "1.0HP";
      else if (val === "15") hpValue = "1.5HP";
      else if (val === "20") hpValue = "2.0HP";
      else if (val === "25") hpValue = "2.5HP";
      else if (val.length === 2 && parseInt(val) > 25)
        hpValue = `${val}HP`; // e.g. 50HP
      else
        hpValue = val.includes(".") || val.length === 1 ? `${val}HP` : hpValue;
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

  const metaTitle = product.metaTitle || (product as unknown as Record<string, unknown>).meta_title as string | null | undefined;
  const metaDescription = product.metaDescription || (product as unknown as Record<string, unknown>).meta_description as string | null | undefined;

  let title = "";
  if (metaTitle) {
    title = metaTitle;
  } else {
    // Strategy: [Category] [Synonym] [Brand] [HP] [SKU] [Tech]
    title = `${categoryName} ${synonyms} ${brandName} ${hpValue} ${mainSku} Inverter`
      .replace(/\s+/g, " ")
      .trim();
  }

  title = sanitizeAndFormatTitle(title, false);

  let description = "";
  if (metaDescription) {
    description = metaDescription;
  } else {
    description = `Điện máy ELC - Chuyên cung cấp ${categoryName} ${brandName} ${mainSku} ${hpValue}${hpLocal} chính hãng. Máy lạnh giá tốt nhất thị trường, tiết kiệm điện vượt trội, hỗ trợ thi công lắp đặt máy lạnh chuyên nghiệp. Xem ngay!`
      .replace(/\s+/g, " ")
      .trim();
  }

  if (location) {
    title = appendLocationToTitle(title, location);
    description = appendLocationToDescription(description, location);
  }

  const url = location 
    ? `${BASE_URL}/san-pham/${product.slug}/${location.slug}`
    : `${BASE_URL}/san-pham/${product.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
      url: url,
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
export function generateCategoryMetadata(
  category: Record<string, unknown> | null | undefined,
  totalCount?: number,
  location?: District,
): Metadata {
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

  const metaTitle = (category.metaTitle || category.meta_title) as
    | string
    | undefined;
  const metaDescription = (category.metaDescription ||
    category.meta_description) as string | undefined;
  const imageUrl = (category.image_url || category.imageUrl) as
    | string
    | undefined;

  if (isProject) {
    title = `Dự án ${name} tiêu biểu`;
    description = `Khám phá các công trình ${name} thực tế do ELC thực hiện. Giải pháp không khí chuyên nghiệp, thẩm mỹ và bền bỉ. Xem ngay các dự án tiêu biểu!`;
  } else {
    // 1. Use meta_title if provided in DB
    // 2. Fallback to smart generated displayName
    title = metaTitle || `Danh sách ${displayName} chính hãng, giá tốt nhất`;

    if (
      !metaTitle &&
      (name.toLowerCase().includes("âm trần") ||
        name.toLowerCase().includes("giấu trần"))
    ) {
      title = `Danh sách ${displayName} cho hệ thống VRV/VRF chính hãng`;
    }
    description =
      metaDescription ||
      `Chuyên cung cấp ${displayName} chính hãng tại Điện máy ELC. Máy lạnh giá tốt nhất thị trường, hỗ trợ thi công lắp đặt máy lạnh chuyên nghiệp, bảo hành uy tín. Xem ngay!`;
  }

  title = sanitizeAndFormatTitle(title, false);

  if (location) {
    title = appendLocationToTitle(title, location);
    description = appendLocationToDescription(description, location);
  }

  const categorySlug = (category.slug || "") as string;
  const url = location 
    ? `${BASE_URL}/san-pham/${categorySlug}/${location.slug}`
    : `${BASE_URL}/san-pham/${categorySlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
      url: url,
      type: "website",
    },
  };
}

/**
 * Generates SEO for Brand pages
 */
export function generateBrandMetadata(
  brand: Record<string, unknown> | null | undefined,
  category?: Record<string, unknown> | null | undefined,
  location?: District,
): Metadata {
  if (!brand) return {};

  const brandName = (brand.name || "") as string;
  const categoryName = (category?.name || "Máy lạnh") as string;

  const synonym = categoryName.toLowerCase().includes("máy lạnh")
    ? " (Điều hòa)"
    : "";
  const displayName = `${categoryName}${synonym} ${brandName}`;

  const metaTitle = (brand.metaTitle || brand.meta_title) as string | undefined;
  const metaDescription = (brand.metaDescription || brand.meta_description) as
    | string
    | undefined;
  const logo = (brand.logoUrl || brand.logo_url) as string | undefined;

  // 1. Use meta_title if provided in DB
  // 2. Fallback to smart generated name
  const title = metaTitle || `${displayName} chính hãng, giá tốt nhất`;
  const description =
    metaDescription ||
    `Chuyên cung cấp ${displayName} chính hãng tại Điện máy ELC. Cam kết chất lượng cao, bảo hành uy tín, thi công lắp đặt chuyên nghiệp. Xem ngay!`;

  let finalTitle = sanitizeAndFormatTitle(title, false);

  let finalDescription = description;
  if (location) {
    finalTitle = appendLocationToTitle(finalTitle, location);
    finalDescription = appendLocationToDescription(finalDescription, location);
  }

  const brandSlug = (brand.slug || "") as string;
  const url = location 
    ? `${BASE_URL}/san-pham/${brandSlug}/${location.slug}`
    : `${BASE_URL}/san-pham/${brandSlug}`;

  return {
    title: finalTitle,
    description: finalDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      images: logo ? [logo] : [],
      url: url,
      type: "website",
    },
  };
}

/**
 * Generates SEO for Service pages
 */
export function generateServiceMetadata(
  service: Record<string, unknown> | null | undefined,
  location?: District,
): Metadata {
  if (!service) return {};

  const serviceTitle = (service.title || "") as string;
  const image = (service.image || service.image_url) as string | undefined;

  const metaTitle = (service.metaTitle || service.meta_title) as string | undefined;
  const metaDescription = (service.metaDescription || service.meta_description) as string | undefined;

  const title = metaTitle || `${serviceTitle} - Dịch vụ chuyên nghiệp | ${SHOP_NAME}`;
  const description = metaDescription || `Cung cấp dịch vụ ${serviceTitle} uy tín, giá tốt tại ${SHOP_NAME}. Đội ngũ kỹ thuật tay nghề cao, thi công nhanh chóng, hỗ trợ 24/7. Click để nhận báo giá chi tiết!`;

  let finalTitle = sanitizeAndFormatTitle(title, false);

  let finalDescription = description;
  if (location) {
    finalTitle = appendLocationToTitle(finalTitle, location);
    finalDescription = appendLocationToDescription(finalDescription, location);
  }

  const serviceSlug = (service.slug || "") as string;
  const url = location 
    ? `${BASE_URL}/dich-vu/${serviceSlug}/${location.slug}`
    : `${BASE_URL}/dich-vu/${serviceSlug}`;

  return {
    title: finalTitle,
    description: finalDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      images: image ? [image] : [],
      url: url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: image ? [image] : [],
    },
  };
}

/**
 * Generates JSON-LD for Collection pages (Category or Brand) (Price Range)
 * This is what makes Google show "₫4,990,000 to ₫58,640,000"
 */
export function generateCollectionSchema(
  entity: unknown,
  products: Array<{
    salePrice?: number;
    sale_price?: number;
    originalPrice?: number;
    original_price?: number;
    images?: string[];
  }>,
  location?: District,
) {
  if (!entity || !products || products.length === 0) return null;

  const prices = products
    .map((p) => {
      const salePrice = p.salePrice ?? p.sale_price ?? 0;
      const originalPrice = p.originalPrice ?? p.original_price ?? 0;
      const rawPrice = salePrice || originalPrice || 0;
      return Math.round(rawPrice / 1000) * 1000;
    })
    .filter((p) => p > 0);

  if (prices.length === 0) return null;

  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);

  const entityRecord = entity as Record<string, unknown>;
  const entityName = (entityRecord.name || entityRecord.displayName) as
    | string
    | undefined;
  const rawEntityDesc = (entityRecord.metaDescription ||
    entityRecord.meta_description ||
    entityRecord.description) as string | undefined;
  // Strip any accidental "URL:" fragments that may have been entered in the DB
  const entityDesc = rawEntityDesc
    ? rawEntityDesc.replace(/\bURL:\s*/gi, "").trim() || undefined
    : undefined;

  // Extract first product image to make Product schema valid and warning-free
  const firstProductWithImage = products.find((p) => {
    const imgs = p.images;
    return Array.isArray(imgs) && imgs.length > 0;
  });
  const imageUrl = firstProductWithImage ? firstProductWithImage.images?.[0] : undefined;

  const url = location 
    ? `${BASE_URL}/san-pham/${entityRecord.slug}/${location.slug}`
    : `${BASE_URL}/san-pham/${entityRecord.slug}`;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: location
      ? `${entityName} chính hãng tại ${location.name}`
      : `${entityName} chính hãng`,
    description: appendLocationToDescription(
      entityDesc || `Chuyên cung cấp ${entityName} chính hãng tại Điện máy ELC. Giá tốt nhất thị trường, hỗ trợ lắp đặt chuyên nghiệp, bảo hành uy tín. Xem ngay!`,
      location
    ),
    image: imageUrl,
    url: url,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: lowPrice,
      highPrice: highPrice,
      priceCurrency: "VND",
      offerCount: prices.length,
      ...(location ? {
        areaServed: [
          {
            "@type": "AdministrativeArea",
            "name": location.name,
          },
          {
            "@type": "AdministrativeArea",
            "name": "Thành phố Hồ Chí Minh",
          }
        ]
      } : {})
    },
  };
}

/**
 * Generates JSON-LD Structured Data for Google Rich Snippets
 */
export function generateProductSchema(product: ProductWithRelations, location?: District) {
  const rawProduct = product as unknown as Record<string, unknown>;
  const rawSalePrice = (product.salePrice ?? rawProduct.sale_price ?? 0) as number;
  const rawOriginalPrice = (product.originalPrice ??
    rawProduct.original_price ??
    0) as number;
  const salePrice = Math.round(rawSalePrice / 1000) * 1000;
  const originalPrice = Math.round(rawOriginalPrice / 1000) * 1000;
  const price = salePrice || originalPrice || 0;
  const hasPrice = price > 0;

  const hasDiscount =
    hasPrice &&
    typeof salePrice === "number" &&
    typeof originalPrice === "number" &&
    salePrice > 0 &&
    originalPrice > 0 &&
    salePrice < originalPrice;

  const stockStatus = (product.stockStatus ?? rawProduct.stock_status) as
    | string
    | undefined;
  const mpn = (product.mpn ?? rawProduct.mpn) as string | null | undefined;
  const gtin = (product.gtin ?? rawProduct.gtin) as string | null | undefined;
  const hasGtin = typeof gtin === "string" && gtin.trim().length > 0;
  const firstSku = product.sku ? product.sku.split(/[\s/]+/)[0] : "";

  // Reuse the smart metadata logic to get the same description
  const metadata = generateProductMetadata(product, location);

  const brandLogo =
    product.brand?.logoUrl ||
    (product.brand as unknown as Record<string, unknown> | undefined)?.logo_url;

  const productUrl = location 
    ? `${BASE_URL}/san-pham/${product.slug}/${location.slug}`
    : `${BASE_URL}/san-pham/${product.slug}`;

  const productName = location 
    ? `${product.name} tại ${location.name}`
    : product.name;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: productName,
    image:
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": productUrl,
      primaryImageOfPage:
        Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]
          : undefined,
    },
    description: metadata.description || "",
    sku: firstSku,
    mpn: mpn || undefined,
    gtin: hasGtin ? gtin : undefined,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || SHOP_NAME,
      logo: (brandLogo || undefined) as string | undefined,
    },
    offers: hasPrice ? {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "VND",
      price: price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        stockStatus === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      priceSpecification: hasDiscount
        ? {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/ListPrice",
            price: originalPrice,
            priceCurrency: "VND",
          }
        : undefined,
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
      ...(location ? {
        areaServed: [
          {
            "@type": "AdministrativeArea",
            "name": location.name,
          },
          {
            "@type": "AdministrativeArea",
            "name": "Thành phố Hồ Chí Minh",
          }
        ]
      } : {})
    } : undefined,
  };
}

interface SchemaContact {
  type: string;
  value: string;
  isActive: boolean;
}


/**
 * Generates JSON-LD Structured Data for the Homepage Organization, LocalBusiness and WebSite Sitelinks Searchbox
 */
export function generateHomeSchema(
  settings: Record<string, string>,
  contacts: SchemaContact[],
  branches?: Branch[],
) {
  const findContact = (type: string) => contacts.find((c) => c.type === type && c.isActive)?.value;
  
  const companyPhone = findContact("phone") || "0789978898";
  const companyEmail = findContact("email") || "elc.jointstock@gmail.com";
  
  const branchAddress = branches?.find((b) => b.isPublished)?.address || branches?.[0]?.address;
  const companyAddress = findContact("address") || branchAddress || "06 Dương Quảng Hàm, phường An Nhơn, Thành phố Hồ Chí Minh";
  
  const parsedMainAddress = parseAddress(companyAddress);
  const schemaPhone = formatPhone(companyPhone);

  const branchSchemas = (branches || [])
    .filter((b) => b.isPublished)
    .map((b) => SEOSchema.getLocalBusiness(b));

  return {
    "@context": "https://schema.org",
    "@graph": [
      SEOSchema.getOrganization(branches, contacts),
      {
        "@type": "HVACBusiness",
        "@id": `${BASE_URL}/#localbusiness`,
        "name": "Điện máy ELC",
        "image": `${BASE_URL}/opengraph-image.png`,
        "telephone": schemaPhone,
        "email": companyEmail,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": parsedMainAddress.streetAddress,
          "addressLocality": parsedMainAddress.addressLocality || "Gò Vấp",
          "addressRegion": parsedMainAddress.addressRegion || "Thành phố Hồ Chí Minh",
          "addressCountry": "VN",
        },
        "priceRange": "$$",
        "url": BASE_URL,
      },
      SEOSchema.getWebSite(),
      ...branchSchemas,
    ],
  };
}

export function detectLocation(text: string): { name: string; type: string } | null {
  if (!text) return null;
  const lowercaseText = text.toLowerCase();
  
  const locations = [
    { name: "Thành phố Hồ Chí Minh", keywords: ["tp. hcm", "tp.hcm", "hồ chí minh", "sài gòn", "tphcm"] },
    { name: "Bình Dương", keywords: ["bình dương"] },
    { name: "Đồng Nai", keywords: ["đồng nai", "biên hòa"] },
    { name: "Bình Phước", keywords: ["bình phước", "đồng xoài"] },
    { name: "Long An", keywords: ["long an", "tân an"] },
    { name: "Bà Rịa - Vũng Tàu", keywords: ["vũng tàu", "bà rịa"] },
    { name: "Tây Ninh", keywords: ["tây ninh"] },
  ];

  for (const loc of locations) {
    for (const keyword of loc.keywords) {
      if (lowercaseText.includes(keyword)) {
        return { name: loc.name, type: "AdministrativeArea" };
      }
    }
  }

  const districts = [
    "quận 1", "quận 2", "quận 3", "quận 4", "quận 5", "quận 6", "quận 7", "quận 8", "quận 9", "quận 10", "quận 11", "quận 12",
    "gò vấp", "bình thạnh", "phú nhuận", "tân bình", "tân phú", "thủ đức", "bình tân", "hóc môn", "củ chi", "nhà bè", "cần giờ"
  ];
  for (const dist of districts) {
    if (lowercaseText.includes(dist)) {
      return { name: "Thành phố Hồ Chí Minh", type: "AdministrativeArea" };
    }
  }

  return null;
}

export function extractFirstImageFromDescription(description: unknown): string | null {
  if (!description) return null;

  if (typeof description === "string") {
    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
    return null;
  }

  if (typeof description === "object" && description !== null) {
    const doc = description as Record<string, unknown>;
    
    const findImageSrc = (node: Record<string, unknown>): string | null => {
      if (node.type === "image" && node.attrs && typeof node.attrs === "object") {
        const attrs = node.attrs as Record<string, unknown>;
        if (typeof attrs.src === "string") {
          return attrs.src;
        }
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          if (child && typeof child === "object") {
            const found = findImageSrc(child as Record<string, unknown>);
            if (found) return found;
          }
        }
      }
      return null;
    };

    return findImageSrc(doc);
  }

  return null;
}

export function generateProjectTypeMetadata(
  projectType: { name: string; slug: string; image?: string | null; metaTitle?: string | null; metaDescription?: string | null },
  searchParams: { service?: string; category?: string; condition?: string },
  serviceName?: string,
  categoryName?: string,
) {
  const metaTitle = projectType.metaTitle;
  const metaDescription = projectType.metaDescription;
  const image = projectType.image;

  // Rule: If metaTitle or metaDescription is null or empty, set robots to noindex
  if (!metaTitle || !metaDescription) {
    return {
      title: `${projectType.name} | ${SHOP_NAME}`,
      description: "",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const titleParts: string[] = [];
  const descParts: string[] = [];

  if (serviceName) {
    titleParts.push(serviceName);
    descParts.push(`dịch vụ ${serviceName.toLowerCase()}`);
  }

  if (categoryName) {
    titleParts.push(categoryName);
    descParts.push(`sản phẩm ${categoryName.toLowerCase()}`);
  }

  if (searchParams.condition) {
    const conditionText = searchParams.condition === "new" ? "mới 100%" : "thanh lý";
    titleParts.push(conditionText);
    descParts.push(`tình trạng ${conditionText}`);
  }

  let title = metaTitle;
  let description = metaDescription;

  if (titleParts.length > 0) {
    title = `Dự án ${titleParts.join(" - ")} cho ${projectType.name}`;
    description = `Danh sách các dự án thực tế về ${descParts.join(" sử dụng ")} cho loại hình ${projectType.name} do ELC thực hiện.`;
  }

  title = sanitizeAndFormatTitle(title, false);

  const cleanUrl = `${BASE_URL}/du-an/${projectType.slug}`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: cleanUrl,
    },
    openGraph: {
      title,
      description,
      url: cleanUrl,
      type: "website",
      images: image ? [{ url: image }] : [],
    },
  };
}

export function generateProjectDetailMetadata(
  project: { 
    title: string; 
    slug: string; 
    metaTitle?: string | null; 
    metaDescription?: string | null; 
    images?: string[]; 
    description?: unknown;
  }
) {
  const metaTitle = project.metaTitle;
  const metaDescription = project.metaDescription;

  // Rule: If metaTitle or metaDescription is null or empty, set robots to noindex
  if (!metaTitle || !metaDescription) {
    return {
      title: sanitizeAndFormatTitle(project.title, false),
      description: "",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  let title = sanitizeAndFormatTitle(metaTitle, false);

  const cleanUrl = `${BASE_URL}/du-an/${project.slug}`;
  const representativeImage = project.images?.[0] || extractFirstImageFromDescription(project.description);

  return {
    title,
    description: metaDescription,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: cleanUrl,
    },
    openGraph: {
      title,
      description: metaDescription,
      url: cleanUrl,
      type: "article",
      images: representativeImage ? [{ url: representativeImage }] : [],
    },
  };
}

export interface ProjectDetailSchemaInput {
  title: string;
  slug: string;
  metaDescription?: string | null;
  images?: string[];
  description?: unknown;
  createdAt?: string;
  updatedAt?: string;
  services?: Array<{ id: string; title: string; slug: string }>;
  categories?: Array<{ 
    id: string; 
    name: string; 
    slug: string; 
    condition?: "new" | "used";
    lowPrice?: number;
    highPrice?: number;
    offerCount?: number;
  }>;
  projectType?: {
    id: string;
    name: string;
    slug?: string | null;
  } | null;
}

export function generateProjectDetailSchema(
  project: ProjectDetailSchemaInput,
  branches: Branch[],
  contacts?: Array<{ type: string; value: string; isActive: boolean }>
) {
  let images = project.images || [];
  if (images.length === 0) {
    const extractedImage = extractFirstImageFromDescription(project.description);
    if (extractedImage) {
      images = [extractedImage];
    }
  }

  const cleanUrl = `${BASE_URL}/du-an/${project.slug}`;

  const textToParse = `${project.title} ${project.metaDescription || ""}`;
  const loc = detectLocation(textToParse);
  
  let spatialCoverage: Record<string, unknown> | undefined = undefined;
  if (loc) {
    spatialCoverage = {
      "@type": "AdministrativeArea",
      "name": loc.name,
    };
  }

  const articleId = `${cleanUrl}#article`;

  const serviceAbouts = (project.services || []).map((svc) => ({
    ...SEOSchema.getService(svc),
    "subjectOf": { "@id": articleId }
  }));

  const catLowPrices = (project.categories || [])
    .map((c) => c.lowPrice || 0)
    .filter((p) => p > 0);
  const catHighPrices = (project.categories || [])
    .map((c) => c.highPrice || 0)
    .filter((p) => p > 0);

  const absoluteLow = catLowPrices.length > 0 ? Math.min(...catLowPrices) : 5000000;
  const absoluteHigh = catHighPrices.length > 0 ? Math.max(...catHighPrices) : 80000000;
  const totalOfferCount = (project.categories || [])
    .reduce((sum, c) => sum + (c.offerCount || 0), 0) || 10;

  const categoryAbouts = (project.categories || []).map((cat) => ({
    ...SEOSchema.getProductCategory({
      ...cat,
      lowPrice: absoluteLow,
      highPrice: absoluteHigh,
      offerCount: totalOfferCount
    }),
    "subjectOf": { "@id": articleId }
  }));

  const about = [
    ...serviceAbouts.map((s) => ({ "@id": s["@id"] })),
    ...categoryAbouts.map((c) => ({ "@id": c["@id"] }))
  ];

  const breadcrumbElements = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Trang chủ",
      "item": BASE_URL,
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Dự án",
      "item": `${BASE_URL}/du-an`,
    },
  ];

  if (project.projectType) {
    breadcrumbElements.push({
      "@type": "ListItem",
      "position": 3,
      "name": project.projectType.name,
      "item": project.projectType.slug
        ? `${BASE_URL}/du-an/${project.projectType.slug}`
        : `${BASE_URL}/du-an`,
    });
  }

  breadcrumbElements.push({
    "@type": "ListItem",
    "position": project.projectType ? 4 : 3,
    "name": project.title,
    "item": cleanUrl,
  });

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "@id": `${cleanUrl}#breadcrumb`,
    "itemListElement": breadcrumbElements,
  };

  const branchNodes = (branches || [])
    .filter((b) => b.isPublished)
    .map((b) => SEOSchema.getLocalBusiness(b));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${cleanUrl}#article`,
        "headline": project.title,
        "description": project.metaDescription || project.title,
        "image": images.length > 0 ? images : [`${BASE_URL}/opengraph-image.png`],
        "datePublished": project.createdAt || new Date().toISOString(),
        "dateModified": project.updatedAt || project.createdAt || new Date().toISOString(),
        "author": {
          "@id": `${BASE_URL}/#organization`,
        },
        "publisher": {
          "@id": `${BASE_URL}/#organization`,
        },
        "breadcrumb": {
          "@id": `${cleanUrl}#breadcrumb`,
        },
        ...(spatialCoverage ? { spatialCoverage } : {}),
        ...(about.length > 0 ? { about } : {}),
      },
      SEOSchema.getOrganization(branches, contacts),
      SEOSchema.getWebSite(),
      breadcrumbSchema,
      ...serviceAbouts,
      ...categoryAbouts,
      ...branchNodes
    ],
  };
}

export function generateServiceDetailSchema(
  service: { title: string; slug: string; metaDescription?: string | null },
  branches: Branch[],
  contacts?: Array<{ type: string; value: string; isActive: boolean }>,
  location?: District
) {
  const cleanUrl = location 
    ? `${BASE_URL}/dich-vu/${service.slug}/${location.slug}`
    : `${BASE_URL}/dich-vu/${service.slug}`;
  
  const breadcrumbElements = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Trang chủ",
      "item": BASE_URL,
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Dịch vụ",
      "item": `${BASE_URL}/dich-vu`,
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": service.title,
      "item": `${BASE_URL}/dich-vu/${service.slug}`,
    },
  ];

  if (location) {
    breadcrumbElements.push({
      "@type": "ListItem",
      "position": 4,
      "name": `${service.title} tại ${location.name}`,
      "item": cleanUrl,
    });
  }

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "@id": `${cleanUrl}#breadcrumb`,
    "itemListElement": breadcrumbElements,
  };

  const serviceNode = SEOSchema.getService(service);
  if (location) {
    serviceNode["@id"] = `${cleanUrl}#service`;
    serviceNode.name = `${service.title} tại ${location.name}`;
    serviceNode.url = cleanUrl;
    if (service.metaDescription) {
      serviceNode.description = appendLocationToDescription(service.metaDescription, location);
    }
    serviceNode.areaServed = [
      {
        "@type": "AdministrativeArea",
        "name": location.name,
      },
      {
        "@type": "AdministrativeArea",
        "name": "Thành phố Hồ Chí Minh",
      }
    ];
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      serviceNode,
      SEOSchema.getOrganization(branches, contacts),
      SEOSchema.getWebSite(),
      breadcrumbSchema,
    ],
  };
}

export function generateBranchDetailSchema(
  branch: Branch,
  branches: Branch[],
  settings?: Record<string, string>,
  contacts?: Array<{ type: string; value: string; isActive: boolean }>
) {
  const cleanUrl = `${BASE_URL}/thong-tin/${branch.slug}`;

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "@id": `${cleanUrl}#breadcrumb`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Trang chủ",
        "item": BASE_URL,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Thông tin",
        "item": `${BASE_URL}/thong-tin`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": branch.name,
        "item": cleanUrl,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      SEOSchema.getLocalBusiness(branch),
      SEOSchema.getOrganization(branches, contacts),
      SEOSchema.getWebSite(),
      breadcrumbSchema,
    ],
  };
}

/**
 * Generates SEO for System Pages
 */
export function generateSystemPageMetadata(
  systemPage: { metaTitle: string | null; metaDescription: string | null } | null | undefined,
  fallbackTitle: string,
  fallbackDescription: string,
  path: string,
): Metadata {
  const title = systemPage?.metaTitle || fallbackTitle;
  const description = systemPage?.metaDescription || fallbackDescription;
  const cleanUrl = `${BASE_URL}${path}`;
  const isHome = path === "/" || path === "";
  const finalTitle = sanitizeAndFormatTitle(title, isHome);

  return {
    title: finalTitle,
    description,
    alternates: {
      canonical: cleanUrl,
    },
    openGraph: {
      title: finalTitle,
      description,
      url: cleanUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description,
    },
  };
}

interface RichTextNode {
  type: string;
  text?: string;
  content?: RichTextNode[];
  attrs?: Record<string, unknown>;
  [key: string]: unknown;
}

function getLocalServiceBlock(location: District): RichTextNode[] {
  const streetsMap: Record<string, string> = {
    "quan-1": "Nguyễn Huệ, Đồng Khởi, Lê Lợi, Hàm Nghi, Trần Hưng Đạo",
    "quan-3": "Cách Mạng Tháng Tám, Nguyễn Đình Chiểu, Điện Biên Phủ, Nam Kỳ Khởi Nghĩa, Võ Văn Tần",
    "quan-4": "Đoàn Văn Bơ, Hoàng Diệu, Khánh Hội, Bến Vân Đồn, Tôn Đản",
    "quan-5": "An Dương Vương, Trần Hưng Đạo, Nguyễn Trãi, Hồng Bàng, Nguyễn Tri Phương",
    "quan-6": "Hậu Giang, Kinh Dương Vương, Võ Văn Kiệt, Minh Phụng, Bà Hom",
    "quan-7": "Nguyễn Văn Linh, Huỳnh Tấn Phát, Nguyễn Hữu Thọ, Trần Xuân Soạn, Nguyễn Thị Thập",
    "quan-8": "Phạm Thế Hiển, Tạ Quang Bửu, Hưng Phú, Dương Bá Trạc, Võ Văn Kiệt",
    "quan-10": "Đường 3 Tháng 2, Lý Thường Kiệt, Thành Thái, Tô Hiến Thành, Cách Mạng Tháng Tám",
    "quan-11": "Lạc Long Quân, Lê Đại Hành, Ba Tháng Hai, Minh Phụng, Lãnh Binh Thăng",
    "quan-12": "Quốc Lộ 1A, Tô Ký, Nguyễn Ảnh Thủ, Lê Văn Khương, Hà Huy Giáp",
    "go-vap": "Quang Trung, Phan Văn Trị, Nguyễn Oanh, Lê Đức Thọ, Thống Nhất, Nguyễn Kiệm, Nguyễn Văn Lượng",
    "binh-thanh": "Điện Biên Phủ, Xô Viết Nghệ Tĩnh, Bạch Đằng, Phan Đăng Lưu, Lê Quang Định, Nơ Trang Long",
    "phu-nhuan": "Nguyễn Văn Trỗi, Phan Xích Long, Huỳnh Văn Bánh, Lê Văn Sỹ, Phan Đăng Lưu",
    "tan-binh": "Cộng Hòa, Trường Chinh, Lý Thường Kiệt, Phổ Quang, Hoàng Văn Thụ, Út Tịch",
    "tan-phu": "Lũy Bán Bích, Tân Kỳ Tân Quý, Độc Lập, Nguyễn Sơn, Hòa Bình",
    "binh-tan": "Tên Lửa, Đường Số 7, Kinh Dương Vương, Mã Lò, Ao Đôi, Hương Lộ 2",
    "thu-duc": "Võ Văn Ngân, Kha Vạn Cân, Phạm Văn Đồng, Tô Ngọc Vân, Nguyễn Duy Trinh, Đỗ Xuân Hợp",
    "hoc-mon": "Quốc Lộ 22, Tô Ký, Nguyễn Ảnh Thủ, Phan Văn Hớn, Bùi Văn Ngữ",
    "cu-chi": "Tỉnh Lộ 8, Quốc Lộ 22, Tỉnh Lộ 15, Nguyễn Văn Khạ",
    "nha-be": "Nguyễn Hữu Thọ, Huỳnh Tấn Phát, Lê Văn Lương, Nguyễn Bình",
    "can-gio": "Rừng Sác, Duyên Hải, Thạnh Thới",
    "binh-chanh": "Quốc Lộ 1A, Nguyễn Văn Linh, Trần Đại Nghĩa, Đinh Đức Thiện, Tỉnh Lộ 10"
  };

  const streets = streetsMap[location.slug] || "";
  const isGoVap = location.slug === "go-vap";
  const isQuan12 = location.slug === "quan-12";

  let branchText = "";
  if (isGoVap) {
    branchText = "Showroom trưng bày sản phẩm & Trụ sở chính của Điện máy ELC tọa lạc tại: Số 06 Dương Quảng Hàm, Phường An Nhơn, Quận Gò Vấp, Thành phố Hồ Chí Minh. Khách hàng tại Gò Vấp có thể đến trực tiếp showroom để trải nghiệm sản phẩm thực tế hoặc gọi Hotline 0789978898 để được phục vụ nhanh chóng.";
  } else if (isQuan12) {
    branchText = "Kho hàng lớn của Điện máy ELC được đặt tại: 170 QL1A, Phường Tân Thới Nhất, Quận 12, Thành phố Hồ Chí Minh. Chúng tôi hỗ trợ giao nhận thiết bị, vận chuyển và thi công lắp ráp nhanh cho khách hàng tại khu vực Quận 12 từ kho hàng này.";
  } else {
    branchText = `Chi nhánh phục vụ khu vực này gần bạn nhất: Showroom Điện máy ELC Gò Vấp (Địa chỉ: Số 06 Dương Quảng Hàm, Phường An Nhơn, Quận Gò Vấp). Đội ngũ kỹ thuật viên lưu động chuyên trách khu vực ${location.name} luôn sẵn sàng di chuyển hỗ trợ khảo sát hiện trạng công trình và lắp đặt chỉ trong vòng 30 - 45 phút.`;
  }

  const p1 = `Điện máy ELC cung cấp dịch vụ giao hàng nhanh chóng, khảo sát và thi công lắp đặt máy lạnh chuyên nghiệp tận nơi tại tất cả các khu vực thuộc ${location.name}, đặc biệt hỗ trợ siêu tốc trên các tuyến đường trọng điểm bao gồm: ${streets}.`;
  const p2 = branchText;
  const p3 = `Chính sách ưu đãi đặc biệt dành riêng cho khách hàng tại khu vực ${location.name}: Miễn phí 100% công khảo sát thiết kế hệ thống điều hòa cho các căn hộ, nhà phố, văn phòng, nhà hàng và showroom. Cam kết cung cấp thiết bị chính hãng 100% và vật tư lắp đặt phụ trợ (ống đồng Thái Lan cách nhiệt, dây điện Cadivi) đạt tiêu chuẩn chất lượng cao nhất.`;

  return [
    { type: "horizontalRule" },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: `Khu vực phục vụ và chi nhánh hỗ trợ tại ${location.name}` }]
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: p1 }]
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: p2 }]
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: p3 }]
    }
  ];
}

export function localizeRichText(node: unknown, location?: District): unknown {
  if (!location || !node || typeof node !== "object") return node;

  const replaceLocationTerms = (text: string): string => {
    return text
      .replace(/tất cả các quận huyện thuộc [^.!?]* và lân cận/gi, `khu vực ${location.name}`)
      .replace(/toàn bộ các quận huyện thuộc [^.!?]* và lân cận/gi, `khu vực ${location.name}`)
      .replace(/các quận huyện và lân cận/gi, `khu vực ${location.name}`)
      .replace(/Thành phố Hồ Chí Minh/gi, location.name)
      .replace(/TP\.HCM/gi, location.name)
      .replace(/TPHCM/gi, location.name)
      .replace(/Sài Gòn/gi, location.name);
  };

  const typedNode = node as RichTextNode;
  const updatedNode = { ...typedNode };

  if (typeof updatedNode.text === "string") {
    updatedNode.text = replaceLocationTerms(updatedNode.text);
  }

  if (Array.isArray(updatedNode.content)) {
    updatedNode.content = updatedNode.content.map((child) => 
      localizeRichText(child, location) as RichTextNode
    );
  }

  if (typedNode.type === "doc" && Array.isArray(updatedNode.content)) {
    const alreadyAppended = updatedNode.content.some(
      (child) => child.type === "heading" && 
                 child.content?.some((t) => t.text?.includes("Khu vực phục vụ và chi nhánh"))
    );
    if (!alreadyAppended) {
      updatedNode.content = [...updatedNode.content, ...getLocalServiceBlock(location)];
    }
  }

  return updatedNode;
}



