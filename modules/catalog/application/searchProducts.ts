import Fuse from "fuse.js";
import { ProductFilter, ProductWithRelations, normalizeProductPrice, SpecItem, SpecSubItem } from "../domain";
import { productRepo } from "../infrastructure/SupabaseProductRepository";
import { getQueryTokens, tokenize } from "@/shared/lib/search-utils";


/**
 * Splits query tokens on digit/letter boundaries (e.g. "9000btu" -> ["9000", "btu"])
 */

/**
 * Calculates effective price (sale price if available, otherwise original price)
 */
function effectivePrice(p: {
  salePrice?: number;
  originalPrice?: number;
}): number {
  if (p.salePrice && p.salePrice > 0) return p.salePrice;
  return p.originalPrice || 0;
}

// Define Whitelist and Mapping for HVAC Specs - Focused on Top Essentials
const SPEC_WHITELIST: Record<string, string[]> = {
  "Công suất": ["BTU", "Công suất làm lạnh", "HP", "Ngựa", "Công suất"],
  "Số chiều": [
    "Số chiều",
    "Số chiều làm lạnh",
    "1 chiều/2 chiều",
    "Lạnh/Sưởi",
    "Số chiều hoạt động",
  ],
  "Công nghệ": [
    "Inverter",
    "Công nghệ Inverter",
    "Loại Inverter",
    "Tiết kiệm điện",
    "Công nghệ",
    "Công nghệ tiết kiệm điện",
    "Tính năng tiết kiệm điện",
  ],
  "Lọc không khí": [
    "Hệ thống lọc khí",
    "Tính năng lọc không khí",
    "Khả năng lọc không khí",
    "Bộ lọc khí",
    "Bộ lọc",
    "Màng lọc",
    "Tính năng lọc bụi",
  ],
  "Hiệu suất lọc": ["Hiệu suất lọc không khí", "Hiệu suất lọc"],
  "Loại Gas": ["Loại Gas", "Môi chất lạnh", "Gas", "Môi chất làm lạnh"],
};

const REVERSE_SPEC_MAPPING: Record<string, string> = {};
Object.entries(SPEC_WHITELIST).forEach(([uiLabel, dbLabels]) => {
  dbLabels.forEach((dbLabel) => {
    REVERSE_SPEC_MAPPING[dbLabel.toLowerCase().trim()] = uiLabel;
  });
});


function getCoolingDirection(text: string): string | null {
  const l = text.toLowerCase();
  if (l.includes("hai chiều") || l.includes("2 chiều") || l.includes("sưởi"))
    return "2 Chiều";
  if (
    l.includes("một chiều") ||
    l.includes("1 chiều") ||
    l.includes("chỉ làm lạnh") ||
    l.includes("lạnh")
  )
    return "1 Chiều";
  return null;
}

function getCapacityFromText(text: string): string | null {
  const l = text.toLowerCase();
  // ANY HP
  const hpMatch = l.match(/(\d+(\.\d+)?)\s*(hp|ngựa|ngua)/);
  if (hpMatch) {
    const numeric = parseFloat(hpMatch[1]);
    return `${numeric} HP`;
  }
  return null;
}

function getGasType(text: string): string | null {
  const l = text.toLowerCase();
  if (l.includes("r32")) return "Gas R32";
  if (l.includes("r410a") || l.includes("r410")) return "Gas R410A";
  if (l.includes("r22")) return "Gas R22";
  return null;
}

const normalizeSpecValue = (
  uiLabel: string,
  rawValue: string,
  unit?: string,
  originalLabel?: string,
): string => {
  let val = rawValue.trim();
  if (!val) return "";

  // Combine with unit if provided
  if (unit && !val.toLowerCase().includes(unit.toLowerCase())) {
    val = `${val}${unit}`;
  }

  const lower = val.toLowerCase().replace(/\s/g, "");
  const lowerLabel = (originalLabel || "").toLowerCase();

  if (uiLabel === "Công nghệ") {
    // If it's a star rating or includes "tiết kiệm", it's "Có Inverter"
    if (val.includes("★") || lower.includes("tiếtkiệm")) return "Có Inverter";

    const isNo = lower.includes("không") || lower.includes("non-inverter");
    const isYes = lower.includes("có") || lower.includes("inverter");

    if (isNo) return "Không Inverter";
    if (isYes) return "Có Inverter";

    return "";
  }

  if (uiLabel === "Số chiều") {
    return getCoolingDirection(val) || "";
  }

  if (uiLabel === "Công suất") {
    let numeric = 0;
    const valWithDotAsDecimal = parseFloat(val.replace(/,/g, "."));

    const isHP =
      lowerLabel.includes("hp") ||
      lowerLabel.includes("ngựa") ||
      lowerLabel.includes("ngua") ||
      lowerLabel.includes("mã lực") ||
      lower.includes("hp") ||
      lower.includes("ngựa") ||
      lower.includes("ngua");

    if (isHP) {
      numeric = valWithDotAsDecimal;
      return `${numeric} HP`;
    }

    return "";
  }

  if (uiLabel === "Lọc không khí") {
    if (lower.includes("hepa")) return "Lọc HEPA";
    if (lower.includes("pm2.5") || lower.includes("bụi mịn"))
      return "Lọc bụi mịn PM2.5";
    if (
      lower.includes("ion") ||
      lower.includes("khử mùi") ||
      lower.includes("nanoe")
    )
      return "Khử mùi & Diệt khuẩn";

    if (
      (lower.includes("tiêu chuẩn") ||
        lower.includes("mesh") ||
        lower.includes("lọc thô")) &&
      !lower.includes("hepa") &&
      !lower.includes("pm2.5")
    )
      return "Lọc bụi tiêu chuẩn";

    return "";
  }

  if (uiLabel === "Hiệu suất lọc") {
    const num = parseFloat(val.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return "";
    if (num >= 99.9) return "Trên 99.9% (Ultra)";
    if (num >= 99) return "Trên 99% (HEPA H13)";
    if (num >= 95) return "Trên 95% (HEPA H11)";
    return "Lọc tiêu chuẩn";
  }

  if (uiLabel === "Loại Gas") {
    return getGasType(val) || "";
  }

  return val;
};

// USER SPECIFIED CATEGORY ORDER
const CATEGORY_PRIORITY_ORDER = [
  "may-lanh-treo-tuong",
  "may-loc-khong-khi-may-loc-nuoc",
  "may-lanh-dieu-hoa-tu-dung",
  "may-lanh-am-tran",
  "may-lanh-giau-tran-noi-ong-gio",
  "may-lanh-ap-tran",
  "may-loc-khong-khi-may-cap-khi-tuoi-loc-khong-khi",
  "may-loc-khong-khi-phu-kien-dong-bo-cua-he-thong-cap-gio-tuoi"
];

function getCategoryPriority(slug: string): number {
  const index = CATEGORY_PRIORITY_ORDER.indexOf(slug);
  return index === -1 ? 999 : index;
}

export async function searchProducts(
  q: string,
  options: ProductFilter = {},
): Promise<{
  products: ProductWithRelations[];
  totalCount: number;
  availableFilters: {
    brands: { id: string; name: string; slug: string }[];
    specs: { label: string; values: string[] }[];
    minPrice: number;
    maxPrice: number;
  };
}> {
  // Fetch all products
  const allProducts = await productRepo.getAll({
    categoryId: options.categoryId,
    categoryIds: options.categoryIds,
    isPublished: options.isPublished ?? true,
    isFeatured: options.isFeatured,
  });

  // 1. Search Query
  let searchedProducts = allProducts;
  if (q) {
    const queryTokens = getQueryTokens(q);

    const fuse = new Fuse(allProducts, {
      keys: [
        { name: "name", getFn: (p) => tokenize(p.name ?? ""), weight: 0.6 },
        { name: "sku", getFn: (p) => tokenize(p.sku ?? ""), weight: 0.2 },
        { name: "brand", getFn: (p) => tokenize(p.brand?.name ?? ""), weight: 0.15 },
        { name: "category", getFn: (p) => tokenize(p.category?.name ?? ""), weight: 0.05 },
      ],
      threshold: 0.1,
      minMatchCharLength: 1,
    });

    if (queryTokens.length > 0) {
      if (queryTokens.length === 1) {
        searchedProducts = fuse.search(queryTokens[0]).map((r) => r.item);
      } else {
        const resultSets = queryTokens.map(
          (token) => new Set(fuse.search(token).map((r) => r.item.id)),
        );
        searchedProducts = allProducts.filter((p) =>
          resultSets.every((set) => set.has(p.id)),
        );
      }
    }
  }

  // 2. Available Brands
  const availableBrands = new Map<string, { id: string; name: string; slug: string }>();
  searchedProducts.forEach((p) => {
    if (p.brand) {
      availableBrands.set(p.brandId, { 
        id: p.brandId, 
        name: p.brand.name,
        slug: p.brand.slug
      });
    }
  });

  // 3. Products for Filters
  let productsForFilters = searchedProducts;
  if (options.brandSlugs && options.brandSlugs.length > 0) {
    productsForFilters = searchedProducts.filter((p) =>
      p.brand && options.brandSlugs!.includes(p.brand.slug)
    );
  } else if (options.brandIds && options.brandIds.length > 0) {
    productsForFilters = searchedProducts.filter((p) =>
      options.brandIds!.includes(p.brandId),
    );
  } else if (options.brandId) {
    productsForFilters = searchedProducts.filter(
      (p) => p.brandId === options.brandId,
    );
  }

  // 4. Specs and Prices
  const availableSpecs = new Map<string, Set<string>>();
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  productsForFilters.forEach((p) => {
    const prices = [p.salePrice, p.originalPrice].filter(
      (v) => v !== undefined && v !== null && v > 0,
    ) as number[];
    if (prices.length > 0) {
      const pMin = Math.min(...prices);
      const pMax = Math.max(...prices);
      if (pMin < minPrice) minPrice = pMin;
      if (pMax > maxPrice) maxPrice = pMax;
    }

    const nameDirection = getCoolingDirection(p.name);
    if (nameDirection) {
      if (!availableSpecs.has("Số chiều"))
        availableSpecs.set("Số chiều", new Set());
      availableSpecs.get("Số chiều")!.add(nameDirection);
    }

    const nameCapacity = getCapacityFromText(p.name);
    if (nameCapacity) {
      if (!availableSpecs.has("Công suất"))
        availableSpecs.set("Công suất", new Set());
      availableSpecs.get("Công suất")!.add(nameCapacity);
    }

    const nameGas = getGasType(p.name);
    if (nameGas) {
      if (!availableSpecs.has("Loại Gas"))
        availableSpecs.set("Loại Gas", new Set());
      availableSpecs.get("Loại Gas")?.add(nameGas);
    }

    if (Array.isArray(p.specs)) {
      (p.specs as unknown as SpecItem[]).forEach((s) => {
        if (!s.label) return;
        const uiLabel = REVERSE_SPEC_MAPPING[s.label.toLowerCase().trim()];
        if (!uiLabel) return;
        if (!availableSpecs.has(uiLabel)) availableSpecs.set(uiLabel, new Set());

        const targetSet = availableSpecs.get(uiLabel);
        if (!targetSet) return;
        const items = Array.isArray(s.items) ? s.items : (Array.isArray(s.value) ? s.value : null);

        if (items) {
          (items as (SpecSubItem | string)[]).forEach((item) => {
            const isObj = typeof item === "object" && item !== null;
            const val = isObj && "value" in item ? item.value : (typeof item === "string" ? item : null);
            if (val !== null && val !== undefined) {
              const unit = isObj && "unit" in item ? item.unit : undefined;
              const normalized = normalizeSpecValue(uiLabel, String(val), unit, s.label);
              if (normalized) targetSet.add(normalized);
            }
          });
        } else if (s.value !== undefined && s.value !== null) {
          const normalized = normalizeSpecValue(uiLabel, String(s.value), s.unit, s.label);
          if (normalized) targetSet.add(normalized);
        }
      });
    }
  });

  // 5. Final Filter
  let filtered = productsForFilters;

  if (options.minPrice !== undefined) filtered = filtered.filter((p) => effectivePrice(p) >= (options.minPrice || 0));
  if (options.maxPrice !== undefined) filtered = filtered.filter((p) => effectivePrice(p) <= (options.maxPrice || Infinity));

  if (options.specs && Object.keys(options.specs).length > 0) {
    filtered = filtered.filter((p) => {
      return Object.entries(options.specs!).every(([label, values]) => {
        if (!values || values.length === 0) return true;
        let nameMatch: string | null = null;
        if (label === "Số chiều") nameMatch = getCoolingDirection(p.name);
        else if (label === "Công suất") nameMatch = getCapacityFromText(p.name);
        else if (label === "Loại Gas") nameMatch = getGasType(p.name);
        if (nameMatch && values.includes(nameMatch)) return true;

        const pSpecs = (p.specs as unknown as SpecItem[]) || [];
        return pSpecs.some((s) => {
          if (!s.label) return false;
          const uiLabel = REVERSE_SPEC_MAPPING[s.label.toLowerCase().trim()] || s.label;
          if (uiLabel !== label) return false;
          const pValues: string[] = [];
          const items = Array.isArray(s.items) ? s.items : (Array.isArray(s.value) ? s.value : null);
          if (items) {
            (items as (SpecSubItem | string)[]).forEach((item) => {
              const isObj = typeof item === "object" && item !== null;
              const val = isObj && "value" in item ? item.value : (typeof item === "string" ? item : null);
              if (val !== null && val !== undefined) {
                const unit = isObj && "unit" in item ? item.unit : undefined;
                pValues.push(normalizeSpecValue(uiLabel, String(val), unit, s.label));
              }
            });
          } else if (s.value !== undefined && s.value !== null) {
            pValues.push(normalizeSpecValue(uiLabel, String(s.value), s.unit, s.label));
          }
          return pValues.some((pv) => values.includes(pv));
        });
      });
    });
  }

  // 6. Final Sort Logic - USER PRIORITY
  const matched = filtered;
  const sortFn = (a: ProductWithRelations, b: ProductWithRelations) => {
    // 1. Sort by Category Priority
    const aPriority = getCategoryPriority(a.category?.slug || "");
    const bPriority = getCategoryPriority(b.category?.slug || "");
    if (aPriority !== bPriority) return aPriority - bPriority;

    // 2. Sort by Featured
    if (a.isFeatured !== b.isFeatured) return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);

    // 3. Sort by Order Index
    return (a.orderIndex || 0) - (b.orderIndex || 0);
  };

  if (options.sortBy) {
    switch (options.sortBy) {
      case "price_asc": matched.sort((a, b) => effectivePrice(a) - effectivePrice(b)); break;
      case "price_desc": matched.sort((a, b) => effectivePrice(b) - effectivePrice(a)); break;
      case "newest": matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "discount_desc": matched.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0)); break;
      case "popularity": matched.sort(sortFn); break;
      default: matched.sort(sortFn);
    }
  } else {
    matched.sort(sortFn);
  }

  const totalCount = matched.length;
  const limit = options.limit || 12;
  const offset = options.offset || 0;

  const products = matched.slice(offset, offset + limit).map((p) => {
    const { originalPrice, salePrice, discountPercent } = normalizeProductPrice(
      p.originalPrice,
      p.salePrice,
      p.discountPercent
    );

    return {
      ...p,
      originalPrice,
      salePrice,
      discountPercent,
    };
  });

  return {
    products,
    totalCount,
    availableFilters: {
      brands: Array.from(availableBrands.values()),
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
      specs: Object.keys(SPEC_WHITELIST)
        .filter((label) => availableSpecs.has(label) && availableSpecs.get(label)!.size > 0)
        .map((label) => ({
          label,
          values: Array.from(availableSpecs.get(label)!)
            .filter((v) => v !== "")
            .sort((a, b) => {
              const aNum = parseFloat(a.replace(/[^\d.]/g, ""));
              const bNum = parseFloat(b.replace(/[^\d.]/g, ""));
              if (!isNaN(aNum) && !isNaN(bNum)) {
                if (aNum !== bNum) return aNum - bNum;
                if (a.includes(">") && !b.includes(">")) return 1;
                if (!a.includes(">") && b.includes(">")) return -1;
                return 0;
              }
              return a.localeCompare(b);
            }),
        })),
    },
  };
}
