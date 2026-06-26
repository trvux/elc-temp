import { Branch } from "@/modules/branch/domain";

export const BASE_URL = "https://dienmayelc.com.vn";

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
}

export const SEOSchema = {
  getOrganization(branches?: Branch[], contacts?: Array<{ type: string; value: string; isActive: boolean }>) {
    const sameAsLinks = this.getSameAs(contacts);

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
      "sameAs": sameAsLinks,
      "areaServed": companyBranchCoverage,
      ...(subOrganizations.length > 0 ? { "subOrganization": subOrganizations } : {})
    };
  },

  getSameAs(contacts?: Array<{ type: string; value: string; isActive: boolean }>) {
    const sameAsLinks = [
      "https://www.facebook.com/dienmayelc",
      "https://www.youtube.com/dienmayelc",
    ];

    if (contacts && contacts.length > 0) {
      const links: string[] = [];
      const fbContact = contacts.find((c) => c.type === "facebook" && c.isActive);
      const zaloContact = contacts.find((c) => c.type === "zalo" && c.isActive);

      if (fbContact?.value) {
        const fbVal = fbContact.value;
        const fbUrl = fbVal.startsWith("http") ? fbVal : `https://www.facebook.com/${fbVal}`;
        links.push(fbUrl);
      } else {
        links.push("https://www.facebook.com/dienmayelc");
      }

      if (zaloContact?.value) {
        const zaloVal = zaloContact.value;
        const zaloUrl = zaloVal.startsWith("http") ? zaloVal : `https://zalo.me/${zaloVal}`;
        links.push(zaloUrl);
      }

      links.push("https://www.youtube.com/dienmayelc");
      return links;
    }
    return sameAsLinks;
  },

  getLocalBusiness(
    branch: BranchInput,
  ) {
    const parsedAddress = parseAddress(branch.address);
    const companyEmail = "elc.jointstock@gmail.com";
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
