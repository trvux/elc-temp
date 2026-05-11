import Fuse from "fuse.js";
import { ProductFilter, ProductWithRelations } from "../domain";
import { productRepo } from "../infrastructure/SupabaseProductRepository";

/**
 * Normalizes a string by stripping diacritics and converting to lowercase
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

/**
 * Tokenizes a string into individual alphanumeric words
 */
function tokenize(str: string): string[] {
  return normalize(str)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

/**
 * Strips Telex IME artifacts from a normalized word
 */
function cleanTelex(word: string): string {
  if (!/[aeiou]/.test(word)) return word;
  return word.replace(/[fjx]$/, "").replace(/([aeiou])w/g, "$1");
}

/**
 * Flattens specs JSON into a single searchable string
 */
function flattenSpecs(specs: unknown): string {
  if (!Array.isArray(specs)) return "";
  return (specs as any[])
    .flatMap((s) => {
      if (Array.isArray(s.items)) {
        return s.items.flatMap((i: any) => [i.value ?? "", i.unit ?? ""]);
      }
      return [s.value ?? ""];
    })
    .join(" ");
}

/**
 * Splits query tokens on digit/letter boundaries (e.g. "9000btu" -> ["9000", "btu"])
 */
function splitDigitLetter(token: string): string[] {
  return token.split(/(?<=\d)(?=[a-z])|(?<=[a-z])(?=\d)/);
}

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
  // ONLY check for HP or Ngựa (e.g. 1HP, 1.5HP, 2 Ngựa)
  const hpMatch = l.match(/(\d+(\.\d+)?)\s*(hp|ngựa|ngua)/);
  if (hpMatch) {
    const numeric = parseFloat(hpMatch[1]);
    // Exact matching for standard HP steps
    if (Math.abs(numeric - 1.0) < 0.05) return "1 HP";
    if (Math.abs(numeric - 1.5) < 0.05) return "1.5 HP";
    if (Math.abs(numeric - 2.0) < 0.05) return "2 HP";
    if (Math.abs(numeric - 2.5) < 0.05) return "2.5 HP";
    if (numeric > 2.7) return "> 2.5 HP";
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

    // ONLY check if the label or value explicitly mentions HP or Ngựa
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

      // Exact matching for standard HP steps
      if (Math.abs(numeric - 1.0) < 0.05) return "1 HP";
      if (Math.abs(numeric - 1.5) < 0.05) return "1.5 HP";
      if (Math.abs(numeric - 2.0) < 0.05) return "2 HP";
      if (Math.abs(numeric - 2.5) < 0.05) return "2.5 HP";
      if (numeric > 2.7) return "> 2.5 HP";
    }

    // Ignore BTU or ambiguous power consumption values as requested
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

export async function searchProducts(
  q: string,
  options: ProductFilter = {},
): Promise<{
  products: ProductWithRelations[];
  totalCount: number;
  availableFilters: {
    brands: { id: string; name: string }[];
    specs: { label: string; values: string[] }[];
    minPrice: number;
    maxPrice: number;
  };
}> {
  // Fetch all products that match the base filters (category, brand, isPublished, etc.)
  // We fetch all because fuzzy search happens in-memory with Fuse.js
  const allProducts = await productRepo.getAll({
    categoryId: options.categoryId,
    categoryIds: options.categoryIds,
    isPublished: options.isPublished ?? true,
    isFeatured: options.isFeatured,
  });

  // 1. First, apply search query if present to get the "searched" set
  let searchedProducts = allProducts;
  if (q) {
    const queryTokens = normalize(q)
      .split(/\s+/)
      .map(cleanTelex)
      .flatMap(splitDigitLetter)
      .filter((t) => t.length >= 2);

    const fuse = new Fuse(allProducts, {
      keys: [
        { name: "name", getFn: (p) => tokenize(p.name ?? ""), weight: 0.65 },
        { name: "sku", getFn: (p) => tokenize(p.sku ?? ""), weight: 0.25 },
        {
          name: "specs",
          getFn: (p) => tokenize(flattenSpecs(p.specs)),
          weight: 0.1,
        },
      ],
      threshold: 0.35,
      minMatchCharLength: 2,
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

  // 2. Calculate available brands from the searched products
  const availableBrands = new Map<string, { id: string; name: string }>();
  searchedProducts.forEach((p) => {
    if (p.brand) {
      availableBrands.set(p.brandId, { id: p.brandId, name: p.brand.name });
    }
  });

  // 3. Apply brand filter to get the set for calculating specs and prices
  let productsForFilters = searchedProducts;
  if (options.brandIds && options.brandIds.length > 0) {
    productsForFilters = searchedProducts.filter((p) =>
      options.brandIds!.includes(p.brandId),
    );
  } else if (options.brandId) {
    productsForFilters = searchedProducts.filter(
      (p) => p.brandId === options.brandId,
    );
  }

  // 4. Extract available specs and prices from the brand-filtered searched set
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
      availableSpecs.get("Loại Gas")!.add(nameGas);
    }

    if (Array.isArray(p.specs)) {
      p.specs.forEach((s: any) => {
        if (!s.label) return;
        const uiLabel = REVERSE_SPEC_MAPPING[s.label.toLowerCase().trim()];
        if (!uiLabel) return;

        if (!availableSpecs.has(uiLabel))
          availableSpecs.set(uiLabel, new Set());

        const targetSet = availableSpecs.get(uiLabel)!;
        const items = Array.isArray(s.items)
          ? s.items
          : Array.isArray(s.value)
            ? s.value
            : null;

        if (items) {
          items.forEach((item: any) => {
            const val =
              item.value !== undefined
                ? item.value
                : typeof item === "string"
                  ? item
                  : null;
            if (val !== null && val !== undefined) {
              const normalized = normalizeSpecValue(
                uiLabel,
                String(val),
                item.unit,
                s.label,
              );
              if (normalized) targetSet.add(normalized);
            }
          });
        } else if (s.value !== undefined && s.value !== null) {
          const normalized = normalizeSpecValue(
            uiLabel,
            String(s.value),
            s.unit,
            s.label,
          );
          if (normalized) targetSet.add(normalized);
        }
      });
    }
  });

  // 5. Final filtering for products (Brand + Price + Specs)
  let filtered = productsForFilters;

  if (options.minPrice !== undefined) {
    filtered = filtered.filter(
      (p) => effectivePrice(p) >= (options.minPrice || 0),
    );
  }
  if (options.maxPrice !== undefined) {
    filtered = filtered.filter(
      (p) => effectivePrice(p) <= (options.maxPrice || Infinity),
    );
  }

  if (options.specs && Object.keys(options.specs).length > 0) {
    filtered = filtered.filter((p) => {
      const pSpecs = p.specs as any[];
      if (!Array.isArray(pSpecs)) return false;

      return Object.entries(options.specs!).every(([label, values]) => {
        if (!values || values.length === 0) return true;

        // Check product NAME
        let nameMatch: string | null = null;
        if (label === "Số chiều") nameMatch = getCoolingDirection(p.name);
        else if (label === "Công suất") nameMatch = getCapacityFromText(p.name);
        else if (label === "Loại Gas") nameMatch = getGasType(p.name);

        // If name matches one of the selected values, it's a hit
        if (nameMatch && values.includes(nameMatch)) {
          return true;
        }

        // Also check SPECS (don't return early if nameMatch exists but doesn't match values)
        const pSpecs = (p.specs as any[]) || [];
        return pSpecs.some((s) => {
          if (!s.label) return false;
          const uiLabel =
            REVERSE_SPEC_MAPPING[s.label.toLowerCase().trim()] || s.label;
          if (uiLabel !== label) return false;

          const pValues: string[] = [];
          const items = Array.isArray(s.items)
            ? s.items
            : Array.isArray(s.value)
              ? s.value
              : null;

          if (items) {
            items.forEach((item: any) => {
              const val =
                item.value !== undefined
                  ? item.value
                  : typeof item === "string"
                    ? item
                    : null;
              if (val !== null && val !== undefined)
                pValues.push(
                  normalizeSpecValue(uiLabel, String(val), item.unit, s.label),
                );
            });
          } else if (s.value !== undefined && s.value !== null) {
            pValues.push(
              normalizeSpecValue(uiLabel, String(s.value), s.unit, s.label),
            );
          }

          return pValues.some((pv) => values.includes(pv));
        });
      });
    });
  }

  let matched: ProductWithRelations[];

  if (q) {
    // Fuzzy Search Implementation
    const queryTokens = normalize(q)
      .split(/\s+/)
      .map(cleanTelex)
      .flatMap(splitDigitLetter)
      .filter((t) => t.length >= 2);

    const fuse = new Fuse(filtered, {
      keys: [
        { name: "name", getFn: (p) => tokenize(p.name ?? ""), weight: 0.65 },
        { name: "sku", getFn: (p) => tokenize(p.sku ?? ""), weight: 0.25 },
        {
          name: "specs",
          getFn: (p) => tokenize(flattenSpecs(p.specs)),
          weight: 0.1,
        },
      ],
      threshold: 0.35,
      minMatchCharLength: 2,
    });

    if (queryTokens.length === 0) {
      matched = filtered;
    } else if (queryTokens.length === 1) {
      matched = fuse.search(queryTokens[0]).map((r) => r.item);
    } else {
      const resultSets = queryTokens.map(
        (token) => new Set(fuse.search(token).map((r) => r.item.id)),
      );
      matched = filtered.filter((p) =>
        resultSets.every((set) => set.has(p.id)),
      );
    }
  } else {
    matched = filtered;
  }

  // Apply Sorting
  if (options.sortBy) {
    switch (options.sortBy) {
      case "price_asc":
        matched.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case "price_desc":
        matched.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case "newest":
        matched.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "popularity":
        matched.sort(
          (a, b) =>
            (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) ||
            (b.orderIndex || 0) - (a.orderIndex || 0),
        );
        break;
      case "discount_desc":
        matched.sort(
          (a, b) => (b.discountPercent || 0) - (a.discountPercent || 0),
        );
        break;
    }
  }

  const totalCount = matched.length;
  const limit = options.limit || 12;
  const offset = options.offset || 0;

  return {
    products: matched.slice(offset, offset + limit),
    totalCount,
    availableFilters: {
      brands: Array.from(availableBrands.values()),
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
      specs: Object.keys(SPEC_WHITELIST)
        .filter(
          (label) =>
            availableSpecs.has(label) && availableSpecs.get(label)!.size > 0,
        )
        .map((label) => ({
          label,
          values: Array.from(availableSpecs.get(label)!)
            .filter((v) => v !== "")
            .sort((a, b) => {
              // Smart numeric sort - extract only numbers for comparison
              const aNum = parseFloat(a.replace(/[^\d.]/g, ""));
              const bNum = parseFloat(b.replace(/[^\d.]/g, ""));
              if (!isNaN(aNum) && !isNaN(bNum)) {
                if (aNum !== bNum) return aNum - bNum;
                // If numbers are same, put the one with '>' last
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
