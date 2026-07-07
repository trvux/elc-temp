import { Branch } from "@/modules/branch/domain";

export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";

// Seo is the unified SEO metadata shape stored as jsonb on products/news/
// projects in elc-go (replacing the old flat metaTitle/metaDescription pair,
// kept alongside during the migration). See docs/SEO-REDESIGN.md.
export interface Seo {
  title?: string | null;
  description?: string | null;
  noindex?: boolean;
}

export function parseAddress(addr: string) {
  const parts = addr.split(",").map((s) => s.trim());
  if (parts.length >= 3) {
    return {
      streetAddress: parts.slice(0, parts.length - 2).join(", "),
      addressLocality: parts[parts.length - 2],
      addressRegion: parts[parts.length - 1],
    };
  }
  return {
    streetAddress: addr,
    addressLocality: undefined,
    addressRegion: undefined,
  };
}

export function formatPhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+84${cleaned.slice(1)}`;
  } else if (!cleaned.startsWith("+") && cleaned.length > 0) {
    return `+${cleaned}`;
  }
  return phone;
}

export interface ServiceInput {
  title: string;
  slug: string;
  metaDescription?: string | null;
}

export interface ProductCategoryInput {
  name: string;
  slug: string;
  metaDescription?: string | null;
  lowPrice?: number;
  highPrice?: number;
  offerCount?: number;
}

export interface BranchInput {
  name: string;
  slug: string;
  phone?: string | null;
  email?: string | null;
  address: string;
  imageUrl?: string | null;
  mapsUrl?: string | null;
}

export const SEOSchema = {
  getOrganization(branches?: Branch[], contacts?: Array<{ type: string; value: string; isActive: boolean }>) {
    const sameAsLinks = this.getSameAs(contacts, branches);

    const mainAddress = contacts?.find((c) => c.type === "address" && c.isActive)?.value || "06 Dương Quảng Hàm, phường An Nhơn, Quận Gò Vấp, Thành phố Hồ Chí Minh";
    const parsedMainAddress = parseAddress(mainAddress);
    const phoneVal = contacts?.find((c) => c.type === "phone" && c.isActive)?.value || "0789978898";
    const formattedPhone = formatPhone(phoneVal);

    const companyBranchCoverage = (branches || [])
      .filter((b) => b.isPublished)
      .map((b) => {
        const parsedBranch = parseAddress(b.address);
        return {
          "@type": "Place",
          "name": b.name,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": parsedBranch.streetAddress,
            "addressLocality": parsedBranch.addressLocality,
            "addressRegion": parsedBranch.addressRegion || "Thành phố Hồ Chí Minh",
            "addressCountry": "VN",
          }
        };
      });

    // Create subOrganization links to all published branch LocalBusiness endpoints
    const subOrganizations = (branches || [])
      .filter((b) => b.isPublished)
      .map((b) => ({
        "@id": `${BASE_URL}/thong-tin/${b.slug}#localbusiness`
      }));

    return {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": "Công ty cổ phần giải pháp công nghệ TMDV ELC",
      "alternateName": "Điện máy ELC",
      "url": BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/icon.svg`,
        "width": 112,
        "height": 112,
      },
      "image": `${BASE_URL}/opengraph-image.png`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": parsedMainAddress.streetAddress,
        "addressLocality": parsedMainAddress.addressLocality || "Gò Vấp",
        "addressRegion": parsedMainAddress.addressRegion || "Thành phố Hồ Chí Minh",
        "addressCountry": "VN",
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": formattedPhone,
        "contactType": "customer service",
        "areaServed": "VN",
        "availableLanguage": ["Vietnamese"]
      },
      "sameAs": sameAsLinks,
      "areaServed": companyBranchCoverage,
      ...(subOrganizations.length > 0 ? { "subOrganization": subOrganizations } : {})
    };
  },

  getSameAs(
    contacts?: Array<{ type: string; value: string; isActive: boolean }>,
    branches?: Branch[],
  ) {
    const links: string[] = [];

    const fbContact = contacts?.find((c) => c.type === "facebook" && c.isActive);
    if (fbContact?.value) {
      const fbVal = fbContact.value;
      links.push(fbVal.startsWith("http") ? fbVal : `https://www.facebook.com/${fbVal}`);
    } else {
      links.push("https://www.facebook.com/dienmayelc");
    }

    const zaloContact = contacts?.find((c) => c.type === "zalo" && c.isActive);
    if (zaloContact?.value) {
      const zaloVal = zaloContact.value;
      links.push(zaloVal.startsWith("http") ? zaloVal : `https://zalo.me/${zaloVal}`);
    }

    // Google Business Profile — sourced from the headquarters branch's verified
    // Maps listing (the only branch record with a claimed/reviewed GBP entity).
    const hqBranch = branches?.find((b) => b.slug === "tru-so-van-phong");
    if (hqBranch?.mapsUrl) {
      links.push(hqBranch.mapsUrl);
    }

    return links;
  },

  getLocalBusiness(
    branch: BranchInput,
  ) {
    const parsedAddress = parseAddress(branch.address);
    const companyEmail = "elc.jointstock@gmail.com";
    const mapsUrl = branch.mapsUrl;
    return {
      "@type": "HVACBusiness",
      "@id": `${BASE_URL}/thong-tin/${branch.slug}#localbusiness`,
      "name": `Điện máy ELC - ${branch.name}`,
      "image": branch.imageUrl || `${BASE_URL}/opengraph-image.png`,
      "telephone": branch.phone ? formatPhone(branch.phone) : undefined,
      "email": branch.email || companyEmail,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": parsedAddress.streetAddress,
        "addressLocality": parsedAddress.addressLocality,
        "addressRegion": parsedAddress.addressRegion,
        "addressCountry": "VN",
      },
      "url": `${BASE_URL}/thong-tin/${branch.slug}`,
      ...(mapsUrl ? { "hasMap": mapsUrl, "sameAs": [mapsUrl] } : {}),
      "branchOf": {
        "@id": `${BASE_URL}/#organization`,
      },
    };
  },

  getWebSite() {
    return {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      "url": BASE_URL,
      "name": "Điện máy ELC",
      "publisher": {
        "@id": `${BASE_URL}/#organization`,
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${BASE_URL}/san-pham?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };
  },

  getService(svc: ServiceInput) {
    return {
      "@type": "Service",
      "@id": `${BASE_URL}/dich-vu/${svc.slug}#service`,
      "name": svc.title,
      "description": svc.metaDescription || undefined,
      "url": `${BASE_URL}/dich-vu/${svc.slug}`,
      "provider": {
        "@id": `${BASE_URL}/#organization`
      },
      "areaServed": [
        {
          "@type": "AdministrativeArea",
          "name": "Thành phố Hồ Chí Minh",
        },
        {
          "@type": "AdministrativeArea",
          "name": "Bình Dương",
        },
        {
          "@type": "AdministrativeArea",
          "name": "Đồng Nai",
        },
      ]
    };
  },

  getProductCategory(cat: ProductCategoryInput) {
    const defaultLowPrice = 5000000;
    const defaultHighPrice = 80000000;
    const defaultCount = 10;

    const lowPrice = cat.lowPrice && cat.lowPrice > 0 ? cat.lowPrice : defaultLowPrice;
    const highPrice = cat.highPrice && cat.highPrice > 0 ? cat.highPrice : defaultHighPrice;
    const offerCount = cat.offerCount && cat.offerCount > 0 ? cat.offerCount : defaultCount;

    return {
      "@type": "Product",
      "@id": `${BASE_URL}/san-pham/${cat.slug}#product`,
      "name": cat.name,
      "description": cat.metaDescription || undefined,
      "brand": {
        "@type": "Brand",
        "name": "Điện máy ELC",
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "VND",
        "lowPrice": lowPrice,
        "highPrice": highPrice,
        "offerCount": offerCount
      }
    };
  }
};
