/**
 * SEO Utilities for Dien May ELC - Premium Version
 */

/**
 * Clean content and extract a plain text summary for meta descriptions.
 * Supports both HTML strings and Tiptap JSON objects.
 */
export function extractMetaDescription(content: any, maxLength: number = 160): string {
  if (!content) return "";
  
  let plainText = "";

  if (typeof content === "string") {
    // Handle HTML String
    const cleanHtml = content.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
    plainText = cleanHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } else if (typeof content === "object") {
    // Handle Tiptap JSON Object - Recursively extract text
    const extractText = (node: any): string => {
      if (node.type === "text") return node.text || "";
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join(" ");
      }
      return "";
    };
    plainText = extractText(content).replace(/\s+/g, " ").trim();
  }
    
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + "...";
}

export const SEO_CONFIG = {
  siteName: "Điện máy ELC",
  titleSeparator: " | ",
  defaultTitle: "Điện máy ELC - Giải pháp Không khí thuần khiết",
  defaultDescription: "Chuyên cung cấp máy lạnh, máy lọc không khí và giải pháp cơ điện lạnh chuyên nghiệp. Đại lý chính hãng Daikin, Mitsubishi, Panasonic...",
  baseUrl: "https://dienmayelc.com.vn",
  organization: {
    name: "CÔNG TY TNHH KỸ THUẬT ELC",
    logo: "https://dienmayelc.com.vn/logo.png",
    phone: "0347 182 186",
    address: "Việt Nam"
  }
};

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_CONFIG.organization.name,
    url: SEO_CONFIG.baseUrl,
    logo: SEO_CONFIG.organization.logo,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SEO_CONFIG.organization.phone,
      contactType: "customer service",
      areaServed: "VN",
      availableLanguage: "Vietnamese"
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "577/15/8 Đường Vườn Lài, Khu phố 2, Phường An Phú Đông",
      addressLocality: "Quận 12",
      addressRegion: "TP.HCM",
      addressCountry: "VN"
    },
    sameAs: [
      // Thêm link Facebook/Fanpage của mày vào đây nếu có
      "https://www.facebook.com/dienmayelc" 
    ]
  };
}

/**
 * Generate Breadcrumb Schema - Helps Google show "ELC > Máy lạnh > Treo tường"
 */
export function generateBreadcrumbSchema(
  items: { name: string; item: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item.startsWith("http")
        ? item.item
        : `${SEO_CONFIG.baseUrl}${item.item}`,
    })),
  };
}

/**
 * Generate a smart, human-readable description based on product specs.
 * Follows the "Translated Specs" logic: Benefits + Technical Validation.
 */
export function generateProductSmartDescription(product: any): string {
  // Priority 1: Manual override from DB
  if (product.short_description && product.short_description.length > 30) {
    return product.short_description;
  }

  const specs = product.specs || [];
  const getSpec = (labels: string[]) => {
    const s = specs.find((item: any) =>
      labels.some((l) => item.label?.toLowerCase().includes(l.toLowerCase()))
    );
    if (!s) return null;
    if (s.value) return s.value.toString().replace(/\t/g, "").trim();
    if (s.items && s.items.length > 0) {
      return s.items
        .map((i: any) => i.value)
        .join(", ")
        .replace(/\t/g, "")
        .trim();
    }
    return null;
  };

  const xuatXu = getSpec(["Xuất xứ", "Origin"]);
  const gas = getSpec(["Gas", "Môi chất"]);
  const dienTich = getSpec(["phòng", "Diện tích", "Area"]);
  const cspf = getSpec(["CSPF", "Hiệu suất"]);

  const name = product.name || "";
  const sku = product.sku || "";
  const nameLower = name.toLowerCase();

  // Tạo "Seed" dựa trên SKU hoặc Tên để chọn câu văn ngẫu nhiên nhưng cố định cho máy đó
  const seed = (sku + name).length % 3;
  
  const genericBenefits = [
    "Giải pháp điều hòa không khí bền bỉ, tối ưu hóa điện năng và vận hành êm ái.",
    "Trải nghiệm không gian mát lạnh tức thì, tiết kiệm điện năng vượt trội cho gia đình.",
    "Đảm bảo luồng gió dễ chịu, vận hành cực êm và độ bền cao chuẩn chính hãng."
  ];

  const inverterBenefits = [
    `Công nghệ Inverter ${nameLower.includes("daikin") ? "Daikin " : ""}tiết kiệm điện vượt trội, hoạt động bền bỉ và cực kỳ êm ái.`,
    "Điều hòa Inverter thế hệ mới, làm lạnh nhanh, tối ưu hóa chi phí điện năng hàng tháng.",
    "Vận hành êm ái với công nghệ biến tần Inverter, mang lại giấc ngủ ngon và sâu hơn."
  ];

  let benefit = genericBenefits[seed];

  if (nameLower.includes("lọc") || nameLower.includes("cấp khí")) {
    benefit = "Hệ thống lọc bụi mịn PM2.5, khử nồm và cấp khí tươi sạch khuẩn chuẩn Châu Âu.";
  } else if (nameLower.includes("inverter")) {
    benefit = inverterBenefits[seed];
  } else if (nameLower.includes("âm trần") || nameLower.includes("giấu trần")) {
    benefit = "Thiết kế sang trọng, tối ưu không gian, phân bổ luồng gió mát lạnh đều khắp căn phòng.";
  }

  const rawParts = [
    `${name} ${sku ? `(${sku})` : ""}.`,
    dienTich ? `Phù hợp diện tích ${dienTich}.` : "",
    benefit,
    gas ? `Sử dụng mô chất ${gas} hiện đại.` : "",
    cspf ? `Chỉ số tiết kiệm điện CSPF ${cspf}.` : "",
    xuatXu ? `Hàng nhập khẩu ${xuatXu} uy tín.` : "",
    "Giá tốt nhất tại ELC.",
  ];

  // Logic cộng dồn câu thông minh
  let result = "";
  for (const part of rawParts) {
    if (!part) continue;
    // Nếu cộng thêm câu này mà vẫn dưới 165 ký tự thì cộng
    if ((result + " " + part).trim().length <= 165) {
      result = (result + " " + part).trim();
    } else {
      // Nếu hết chỗ thì dừng lại, không cộng thêm để tránh bị cụt
      break;
    }
  }

  return result;
}

/**
 * Generate Structured Data (JSON-LD) - Optimized for Search Results
 */
export function generateSchema(
  type:
    | "Product"
    | "Article"
    | "Project"
    | "LocalBusiness"
    | "WebSite"
    | "Organization",
  data: any
) {
  const base = { "@context": "https://schema.org" };

  switch (type) {
    case "Product":
      // Map all specs to additionalProperty for expert-level SEO
      const additionalProperties = (data.specs || [])
        .map((spec: any) => {
          let value = spec.value;
          if (spec.items && Array.isArray(spec.items)) {
            value = spec.items
              .map((i: any) => (i.label ? `${i.label}: ${i.value}` : i.value))
              .join(", ");
          }
          return {
            "@type": "PropertyValue",
            name: spec.label?.replace(/\t/g, "").trim(),
            value: value?.toString().replace(/\t/g, "").trim(),
          };
        })
        .filter((p: any) => p.name && p.value);

      return {
        ...base,
        "@type": "Product",
        name: data.name,
        image: Array.isArray(data.images) ? data.images : [data.images],
        description: data.metaDescription || data.description || data.name,
        sku: data.sku || "ELC-" + (data.id?.substring(0, 8) || "PROD"),
        mpn: data.sku || "ELC-" + (data.id?.substring(0, 8) || "PROD"),
        brand: {
          "@type": "Brand",
          name: data.brand || SEO_CONFIG.siteName,
        },
        // Thêm trường review/rating ảo nếu mày muốn, nhưng tốt nhất để Google tự quét
        offers: {
          "@type": "Offer",
          url: data.url,
          priceCurrency: "VND",
          price: data.price || 0,
          priceValidUntil: "2026-12-31",
          itemCondition: "https://schema.org/NewCondition",
          // MẶC ĐỊNH CÒN HÀNG THEO YÊU CẦU CỦA USER
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: SEO_CONFIG.siteName,
          },
          // THÊM: Khai báo giá gốc để Google hiện gạch ngang giá giảm
          ...(data.originalPrice > data.price && {
            priceSpecification: {
              "@type": "PriceSpecification",
              price: data.originalPrice,
              priceCurrency: "VND",
              valueAddedTaxIncluded: true
            }
          }),
        },
        additionalProperty: additionalProperties,
      };

    case "Article":
      return {
        ...base,
        "@type": "NewsArticle",
        headline: data.title,
        image: data.image ? [data.image] : [],
        datePublished: data.datePublished,
        dateModified: data.dateModified || data.datePublished,
        author: {
          "@type": "Organization",
          name: SEO_CONFIG.siteName,
          url: SEO_CONFIG.baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: SEO_CONFIG.siteName,
          logo: {
            "@type": "ImageObject",
            url: SEO_CONFIG.organization.logo,
          },
        },
      };

    case "Project":
      return {
        ...base,
        "@type": "CreativeWork",
        name: data.title,
        description: data.description,
        image: data.images || [],
        publisher: {
          "@type": "Organization",
          name: SEO_CONFIG.siteName,
        },
      };

    case "LocalBusiness":
      return {
        ...base,
        "@type": "LocalBusiness",
        name: `${SEO_CONFIG.siteName} - ${data.name}`,
        image: data.image || SEO_CONFIG.organization.logo,
        "@id": data.url,
        url: data.url,
        telephone: data.phone || SEO_CONFIG.organization.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: data.address,
          addressLocality: data.city || "Việt Nam",
          addressCountry: "VN",
        },
        priceRange: "$$",
        geo: data.geo,
      };

    case "Organization":
      return {
        ...base,
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
        url: SEO_CONFIG.baseUrl,
        logo: SEO_CONFIG.organization.logo,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: SEO_CONFIG.organization.phone,
          contactType: "customer service",
        },
      };

    case "WebSite":
      return {
        ...base,
        "@type": "WebSite",
        name: SEO_CONFIG.siteName,
        url: SEO_CONFIG.baseUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SEO_CONFIG.baseUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      };

    default:
      return null;
  }
}

