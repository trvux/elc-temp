/**
 * SEO Utilities for Dien May ELC - Premium Version
 */

/**
 * Clean HTML content and extract a plain text summary for meta descriptions.
 */
export function extractMetaDescription(html: string, maxLength: number = 160): string {
  if (!html) return "";
  
  const cleanHtml = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const plainText = cleanHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
    
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

/**
 * Generate Breadcrumb Schema - Helps Google show "ELC > Máy lạnh > Treo tường"
 */
export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item.startsWith('http') ? item.item : `${SEO_CONFIG.baseUrl}${item.item}`
    }))
  };
}

/**
 * Generate Structured Data (JSON-LD) - Optimized for Search Results
 */
export function generateSchema(type: "Product" | "Article" | "Project" | "LocalBusiness" | "WebSite" | "Organization", data: any) {
  const base = { "@context": "https://schema.org" };

  switch (type) {
    case "Product":
      return {
        ...base,
        "@type": "Product",
        name: data.name,
        image: data.images || [],
        description: data.description,
        sku: data.sku,
        mpn: data.sku,
        brand: {
          "@type": "Brand",
          name: data.brand || SEO_CONFIG.siteName
        },
        offers: {
          "@type": "Offer",
          url: data.url,
          priceCurrency: "VND",
          price: data.price || 0,
          priceValidUntil: "2026-12-31",
          itemCondition: "https://schema.org/NewCondition",
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: SEO_CONFIG.siteName
          }
        }
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
          url: SEO_CONFIG.baseUrl
        },
        publisher: {
          "@type": "Organization",
          name: SEO_CONFIG.siteName,
          logo: {
            "@type": "ImageObject",
            url: SEO_CONFIG.organization.logo
          }
        }
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
          name: SEO_CONFIG.siteName
        }
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
          addressCountry: "VN"
        },
        priceRange: "$$",
        geo: data.geo
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
            contactType: "customer service"
          }
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
          "query-input": "required name=search_term_string"
        }
      };

    default:
      return null;
  }
}
