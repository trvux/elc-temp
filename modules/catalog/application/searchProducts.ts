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
  "Kiểu lắp đặt": ["Kiểu lắp đặt", "Loại máy", "Kiểu máy", "Dòng máy"],
  "Công suất": ["BTU", "Công suất làm lạnh", "HP", "Ngựa", "Công suất"],
  "Công nghệ": [
    "Inverter",
    "Công nghệ Inverter",
    "Loại Inverter",
    "Tiết kiệm điện",
    "Công nghệ",
  ],
  "Số chiều": [
    "Số chiều",
    "Số chiều làm lạnh",
    "1 chiều/2 chiều",
    "Làm lạnh/Sưởi",
  ],
};

const REVERSE_SPEC_MAPPING: Record<string, string> = {};
Object.entries(SPEC_WHITELIST).forEach(([uiLabel, dbLabels]) => {
  dbLabels.forEach((dbLabel) => {
    REVERSE_SPEC_MAPPING[dbLabel.toLowerCase().trim()] = uiLabel;
  });
});

function getInstallationType(text: string): string | null {
  const l = text.toLowerCase();
  if (l.includes("treo tường") || l.includes("treotuong") || l.includes("wall")) return "Treo tường";
  if (l.includes("âm trần") || l.includes("amtran") || l.includes("cassette")) return "Âm trần";
  if (l.includes("áp trần") || l.includes("aptran")) return "Áp trần";
  if (l.includes("tủ đứng") || l.includes("tudung") || l.includes("đặt sàn") || l.includes("floor")) return "Tủ đứng / Đặt sàn";
  if (l.includes("giấu trần") || l.includes("giautran") || l.includes("nối ống gió") || l.includes("duct")) return "Giấu trần nối ống gió";
  return null;
}

function getCoolingDirection(text: string): string | null {
  const l = text.toLowerCase();
  if (l.includes("hai chiều") || l.includes("2 chiều") || l.includes("sưởi")) return "2 Chiều";
  if (l.includes("một chiều") || l.includes("1 chiều") || l.includes("chỉ làm lạnh") || l.includes("lạnh")) return "1 Chiều";
  return null;
}

const normalizeSpecValue = (
  uiLabel: string,
  rawValue: string,
  unit?: string,
): string => {
  let val = rawValue.trim();
  if (!val) return "";

  // Combine with unit if provided
  if (unit && !val.toLowerCase().includes(unit.toLowerCase())) {
    val = `${val}${unit}`;
  }

  const lower = val.toLowerCase().replace(/\s/g, "");

  if (uiLabel === "Kiểu lắp đặt") {
    return getInstallationType(val) || "";
  }

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
    const numeric = parseFloat(val.replace(/,/g, "").replace(/\./g, ""));
    const isHP = lower.includes("hp") || (numeric > 0 && numeric < 10);
    const isBTU = lower.includes("btu") || numeric >= 5000;

    if (isHP) {
      if (numeric <= 1.2) return "9.000 BTU (1 HP)";
      if (numeric <= 1.7) return "12.000 BTU (1.5 HP)";
      if (numeric <= 2.2) return "18.000 BTU (2 HP)";
      if (numeric <= 2.7) return "24.000 BTU (2.5 HP)";
      return "Trên 24.000 BTU (> 2.5 HP)";
    }

    if (isBTU) {
      if (numeric <= 10000) return "9.000 BTU (1 HP)";
      if (numeric <= 13500) return "12.000 BTU (1.5 HP)";
      if (numeric <= 20000) return "18.000 BTU (2 HP)";
      if (numeric <= 26000) return "24.000 BTU (2.5 HP)";
      return "Trên 24.000 BTU (> 2.5 HP)";
    }

    return "";
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

  // Extract available filters from ALL products matching the base criteria
  const availableBrands = new Map<string, { id: string; name: string }>();
  const availableSpecs = new Map<string, Set<string>>();
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  allProducts.forEach((p) => {
    if (p.brand) {
      availableBrands.set(p.brandId, { id: p.brandId, name: p.brand.name });
    }

    // Calculate global min/max price for the filter range
    const prices = [p.salePrice, p.originalPrice].filter(
      (v) => v !== undefined && v !== null && v > 0,
    ) as number[];
    if (prices.length > 0) {
      const pMin = Math.min(...prices);
      const pMax = Math.max(...prices);
      if (pMin < minPrice) minPrice = pMin;
      if (pMax > maxPrice) maxPrice = pMax;
    }

    // Extract installation type and direction from NAME as well
    const nameInstType = getInstallationType(p.name);
    if (nameInstType) {
      if (!availableSpecs.has("Kiểu lắp đặt")) availableSpecs.set("Kiểu lắp đặt", new Set());
      availableSpecs.get("Kiểu lắp đặt")!.add(nameInstType);
    }

    const nameDirection = getCoolingDirection(p.name);
    if (nameDirection) {
      if (!availableSpecs.has("Số chiều")) availableSpecs.set("Số chiều", new Set());
      availableSpecs.get("Số chiều")!.add(nameDirection);
    }

    if (Array.isArray(p.specs)) {
      p.specs.forEach((s: any) => {
        if (!s.label) return;

        const uiLabel = REVERSE_SPEC_MAPPING[s.label.toLowerCase().trim()];
        if (!uiLabel) return; // Only include whitelisted specs

        if (!availableSpecs.has(uiLabel))
          availableSpecs.set(uiLabel, new Set());

        const targetSet = availableSpecs.get(uiLabel)!;

        // Handle both s.items and s.value if it's an array
        const items = Array.isArray(s.items)
          ? s.items
          : Array.isArray(s.value)
            ? s.value
            : null;

        if (items) {
          items.forEach((item: any) => {
            const valToNormalize =
              item.value !== undefined
                ? item.value
                : typeof item === "string"
                  ? item
                  : null;
            if (valToNormalize !== null && valToNormalize !== undefined) {
              const normalized = normalizeSpecValue(
                uiLabel,
                String(valToNormalize),
                item.unit,
              );
              if (normalized) targetSet.add(normalized);
            }
          });
        } else if (s.value !== undefined && s.value !== null) {
          const normalized = normalizeSpecValue(
            uiLabel,
            String(s.value),
            s.unit,
          );
          if (normalized) targetSet.add(normalized);
        }
      });
    }
  });

  let filtered = allProducts;

  // Apply brandIds filter
  if (options.brandIds && options.brandIds.length > 0) {
    filtered = filtered.filter((p) => options.brandIds!.includes(p.brandId));
  } else if (options.brandId) {
    filtered = filtered.filter((p) => p.brandId === options.brandId);
  }

  // Apply price filters
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

  // Apply Specs filter
  if (options.specs && Object.keys(options.specs).length > 0) {
    filtered = filtered.filter((p) => {
      const pSpecs = p.specs as any[];
      if (!Array.isArray(pSpecs)) return false;

      return Object.entries(options.specs!).every(([label, values]) => {
        if (!values || values.length === 0) return true;

        // NEW: Check product NAME for installation type and direction as well
        if (label === "Kiểu lắp đặt") {
          const nameInstType = getInstallationType(p.name);
          if (nameInstType && values.includes(nameInstType)) return true;
        }
        if (label === "Số chiều") {
          const nameDirection = getCoolingDirection(p.name);
          if (nameDirection && values.includes(nameDirection)) return true;
        }

        // Find if any spec matches the label (mapped or direct) and has one of the values
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
                  normalizeSpecValue(uiLabel, String(val), item.unit),
                );
            });
          } else if (s.value !== undefined && s.value !== null) {
            pValues.push(normalizeSpecValue(uiLabel, String(s.value), s.unit));
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
        .filter((label) => availableSpecs.has(label))
        .map((label) => ({
          label,
          values: Array.from(availableSpecs.get(label)!)
            .filter((v) => v !== "")
            .sort((a, b) => {
              // Smart numeric sort
              const aNum = parseFloat(a.replace(/,/g, ""));
              const bNum = parseFloat(b.replace(/,/g, ""));
              if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
              return a.localeCompare(b);
            }),
        })),
    },
  };
}
