import { ProductWithRelations } from "@/modules/catalog/domain";
import { Branch } from "@/modules/branch/domain";
import { SEOSchema, parseAddress, formatPhone, BASE_URL } from "./seo-schema";

export const SHOP_NAME = "Điện máy ELC";
export { BASE_URL, parseAddress, formatPhone, SEOSchema };

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

  // Always append Shop Name in the module for consistent branding
  if (!title.endsWith(SHOP_NAME)) {
    title += ` | ${SHOP_NAME}`;
  }

  let description = "";
  if (metaDescription) {
    description = metaDescription;
  } else {
    description = `Điện máy ELC - Chuyên cung cấp ${categoryName} ${brandName} ${mainSku} ${hpValue}${hpLocal} chính hãng. Máy lạnh giá tốt nhất thị trường, tiết kiệm điện vượt trội, hỗ trợ thi công lắp đặt máy lạnh chuyên nghiệp. Xem ngay!`
      .replace(/\s+/g, " ")
      .trim();
  }

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
export function generateCategoryMetadata(
  category: Record<string, unknown> | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalCount?: number,
) {
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
export function generateBrandMetadata(
  brand: Record<string, unknown> | null | undefined,
  category?: Record<string, unknown> | null | undefined,
) {
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
export function generateServiceMetadata(
  service: Record<string, unknown> | null | undefined,
) {
  if (!service) return {};

  const serviceTitle = (service.title || "") as string;
  const image = (service.image || service.image_url) as string | undefined;

  const metaTitle = (service.metaTitle || service.meta_title) as string | undefined;
  const metaDescription = (service.metaDescription || service.meta_description) as string | undefined;

  const title = metaTitle || `${serviceTitle} - Dịch vụ chuyên nghiệp | ${SHOP_NAME}`;
  const description = metaDescription || `Cung cấp dịch vụ ${serviceTitle} uy tín, giá tốt tại ${SHOP_NAME}. Đội ngũ kỹ thuật tay nghề cao, thi công nhanh chóng, hỗ trợ 24/7. Click để nhận báo giá chi tiết!`;

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
      images: image ? [image] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description,
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
  const entityDesc = (entityRecord.metaDescription ||
    entityRecord.meta_description ||
    entityRecord.description) as string | undefined;

  // Extract first product image to make Product schema valid and warning-free
  const firstProductWithImage = products.find((p) => {
    const imgs = p.images;
    return Array.isArray(imgs) && imgs.length > 0;
  });
  const imageUrl = firstProductWithImage ? firstProductWithImage.images?.[0] : undefined;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: `Danh sách sản phẩm ${entityName} chính hãng`,
    description:
      entityDesc ||
      `Khám phá danh sách các sản phẩm ${entityName} chính hãng chất lượng cao tại Điện máy ELC.`,
    image: imageUrl,
    url: `${BASE_URL}/san-pham/${entityRecord.slug}`,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: lowPrice,
      highPrice: highPrice,
      priceCurrency: "VND",
      offerCount: prices.length,
    },
  };
}

/**
 * Generates JSON-LD Structured Data for Google Rich Snippets
 */
export function generateProductSchema(product: ProductWithRelations) {
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
  const metadata = generateProductMetadata(product);

  const brandLogo =
    product.brand?.logoUrl ||
    (product.brand as unknown as Record<string, unknown> | undefined)?.logo_url;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image:
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/san-pham/${product.slug}`,
      primaryImageOfPage:
        Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]
          : undefined,
    },
    description: metadata.description || "",
    sku: firstSku,
    mpn: mpn || undefined,
    gtin: hasGtin ? gtin : undefined,
    identifier_exists: hasGtin,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || SHOP_NAME,
      logo: (brandLogo || undefined) as string | undefined,
    },
    offers: hasPrice ? {
      "@type": "Offer",
      url: `${BASE_URL}/san-pham/${product.slug}`,
      priceCurrency: "VND",
      price: price,
      priceValidUntil: "2026-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        stockStatus === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      identifier_exists: hasGtin,
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

  if (!title.endsWith(SHOP_NAME)) {
    title += ` | ${SHOP_NAME}`;
  }

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
      title: `${project.title} | ${SHOP_NAME}`,
      description: "",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  let title = metaTitle;
  if (!title.endsWith(SHOP_NAME)) {
    title += ` | ${SHOP_NAME}`;
  }

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
        "image": images,
        "datePublished": project.createdAt,
        "dateModified": project.updatedAt || project.createdAt,
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
  contacts?: Array<{ type: string; value: string; isActive: boolean }>
) {
  const cleanUrl = `${BASE_URL}/dich-vu/${service.slug}`;
  
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
        "name": "Dịch vụ",
        "item": `${BASE_URL}/dich-vu`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": service.title,
        "item": cleanUrl,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      SEOSchema.getService(service),
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


