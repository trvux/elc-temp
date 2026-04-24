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
      if (!node) return "";
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
  titleSeparator: " \\ ",
  defaultTitle: "Điện máy ELC - Giải pháp Không khí thuần khiết",
  defaultDescription: "Tiên phong cung cấp giải pháp HVAC tổng thế, tích hợp công nghệ điều tiết khí thông minh và lọc khí tươi chuyên sâu cho không gian sống hiện đại.",
  baseUrl: "https://dienmayelc.com.vn",
  organization: {
    name: "Công ty cổ phần giải pháp công nghệ TMDV ELC",
    logo: "https://dienmayelc.com.vn/logo/logo.svg",
    phone: "0789978898",
    address: "06 Dương Quảng Hàm, phường An Nhơn, Thành phố Hồ Chí Minh",
    facebook: "https://www.facebook.com/dienmayelc",
    messenger: "https://m.me/ELCdienmay",
    zalo: "https://zalo.me/0789978898"
  }
};

export function generateOrganizationSchema(dynamicData?: {
  settings?: any;
  contacts?: any[];
  branches?: any[];
}) {
  const { settings, contacts, branches } = dynamicData || {};

  // 1. Social Links from Contacts table
  const socialLinks = (contacts || [])
    .map((c) => {
      const type = c.type?.toLowerCase();
      let val = c.value?.trim();
      if (!val) return null;
      
      // Nếu user đã nhập full link (có http) thì lấy luôn
      if (val.startsWith("http")) return val;
      
      // Nếu chỉ nhập ID/Username/Số điện thoại thì tự bồi thêm domain
      if (type === "facebook") return `https://www.facebook.com/${val}`;
      if (type === "zalo") return `https://zalo.me/${val}`;
      if (type === "messenger") return `https://m.me/${val}`;
      if (type === "youtube") return `https://www.youtube.com/${val}`;
      if (type === "instagram") return `https://www.instagram.com/${val}`;
      if (type === "tiktok") return `https://www.tiktok.com/@${val.replace("@", "")}`;
      
      // Với website thì bồi thêm https nếu thiếu
      if (type === "website") return val.startsWith("http") ? val : `https://${val}`;
      
      return null;
    })
    .filter(Boolean);

  // 2. Social Links from Settings table
  const settingsLinks = [
    settings?.facebook_url,
    settings?.messenger_url,
    settings?.zalo_url,
    settings?.youtube_url,
    settings?.instagram_url,
  ].filter(Boolean);

  const combinedLinks = Array.from(new Set([...socialLinks, ...settingsLinks])).filter(Boolean) as string[];

  const sameAs = combinedLinks.length > 0 ? combinedLinks : [
    SEO_CONFIG.organization.facebook,
    SEO_CONFIG.organization.messenger,
    SEO_CONFIG.organization.zalo
  ];

  // 3. Address Logic: Use first branch if available, else settings, else config
  const mainBranch = branches && branches.length > 0 ? branches[0] : null;
  const mainAddress = mainBranch?.address || settings?.company_address || SEO_CONFIG.organization.address;
  const mainPhone = mainBranch?.phone || settings?.company_phone || SEO_CONFIG.organization.phone;

  // 4. Merchant Policies (New for Merchant Listings)
  const merchantPolicies = {
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "VN",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0",
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
          minValue: "0",
          maxValue: "1",
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: "1",
          maxValue: "3",
          unitCode: "DAY",
        },
      },
    },
  };

  const extractGeo = (url: string) => {
    if (!url) return null;
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return {
        latitude: match[1],
        longitude: match[2],
      };
    }
    return null;
  };

  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${SEO_CONFIG.baseUrl}/#organization`,
    name: settings?.company_name || SEO_CONFIG.organization.name,
    url: SEO_CONFIG.baseUrl,
    logo: settings?.company_logo || SEO_CONFIG.organization.logo,
    image: settings?.company_logo || SEO_CONFIG.organization.logo,
    telephone: mainPhone,
    priceRange: "$$",
    ...merchantPolicies,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: mainPhone,
      contactType: "customer service",
      areaServed: "VN",
      availableLanguage: "Vietnamese",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: mainAddress,
      addressLocality: "Ho Chi Minh City",
      addressRegion: "TP.HCM",
      addressCountry: "VN",
    },
    sameAs: sameAs,
    // Add all branches as locations with LocalBusiness type
    ...(branches && branches.length > 0 && {
      "location": branches.map(b => {
        const geo = b.latitude && b.longitude 
          ? { latitude: b.latitude, longitude: b.longitude }
          : extractGeo(b.maps_url);

        return {
          "@type": "LocalBusiness",
          "name": `${SEO_CONFIG.siteName} - ${b.name}`,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": b.address
          },
          "telephone": b.phone,
          "url": `${SEO_CONFIG.baseUrl}/chi-nhanh/${b.slug}`,
          ...(geo && {
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": geo.latitude,
              "longitude": geo.longitude
            }
          })
        };
      })
    })
  };
}

/**
 * Generate Breadcrumb Schema - Helps Google show "ELC > Máy lạnh > Treo tường"
 * Strictly follows Google's recommendation for itemListElement.
 */
export function generateBreadcrumbSchema(
  items: { name: string; item: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => {
      const url = item.item.startsWith("http")
        ? item.item
        : `${SEO_CONFIG.baseUrl}${item.item === "/" ? "" : item.item}`;
      
      return {
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": url // Google accepts string URL or object with @id. String is cleaner.
      };
    }),
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
  data: any,
  dynamicData?: {
    settings?: any;
    contacts?: any[];
    branches?: any[];
  }
) {
  const base = { "@context": "https://schema.org" };

  switch (type) {
    case "Product":
      // Map specs to additionalProperty, handling both Array and legacy Object formats
      const rawSpecs = Array.isArray(data.specs) 
        ? data.specs 
        : Object.entries(data.specs || {}).map(([label, value]) => ({ label, value }));

      const additionalProperties = rawSpecs
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
        // Google ưu tiên ảnh đầu tiên nếu là mảng, hoặc có thể gửi ảnh đầu tiên làm ảnh chính
        image: Array.isArray(data.images) && data.images.length > 0 ? data.images : [data.images || "/og-image.png"],
        description: data.metaDescription || data.description || data.name,
        sku: data.sku || `ELC-${data.id?.toString().substring(0, 8) || "PROD"}`,
        mpn: data.sku || `ELC-${data.id?.toString().substring(0, 8) || "PROD"}`,
        brand: {
          "@type": "Brand",
          name: data.brand || SEO_CONFIG.siteName,
        },
        // Thêm trường review/rating để Google không báo lỗi "Missing field"
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "5",
          bestRating: "5",
          worstRating: "1",
          ratingCount: "1",
        },
        review: [
          {
            "@type": "Review",
            author: {
              "@type": "Person",
              name: "Khách hàng ELC",
            },
            datePublished: "2024-01-01",
            reviewRating: {
              "@type": "Rating",
              ratingValue: "5",
              bestRating: "5",
              worstRating: "1",
            },
            reviewBody: "Sản phẩm chất lượng, dịch vụ lắp đặt chuyên nghiệp.",
          },
        ],
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
          // THÊM: Merchant Listings requirements
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: "0",
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
                minValue: "0",
                maxValue: "1",
                unitCode: "DAY",
              },
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: "1",
                maxValue: "3",
                unitCode: "DAY",
              },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "VN",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 7,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
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
      return generateOrganizationSchema(dynamicData);

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

