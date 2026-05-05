import Fuse from "fuse.js";
import { ProductWithRelations, ProductFilter } from "../domain";
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
  return p.salePrice ?? p.originalPrice ?? 0;
}

export async function searchProducts(
  q: string,
  options: ProductFilter = {}
): Promise<{ products: ProductWithRelations[]; totalCount: number }> {
  // Fetch all products that match the base filters (category, brand, isPublished, etc.)
  // We fetch all because fuzzy search happens in-memory with Fuse.js
  const allProducts = await productRepo.getAll({
    categoryId: options.categoryId,
    categoryIds: options.categoryIds,
    brandId: options.brandId,
    isPublished: options.isPublished ?? true,
    isFeatured: options.isFeatured,
  });

  if (!q) {
    // If no query, just return the list with pagination if limit/offset are provided
    let results = allProducts;
    
    // Apply price filters
    if (options.minPrice !== undefined) {
      results = results.filter(p => effectivePrice(p) >= (options.minPrice || 0));
    }
    if (options.maxPrice !== undefined) {
      results = results.filter(p => effectivePrice(p) <= (options.maxPrice || Infinity));
    }

    const totalCount = results.length;
    const limit = options.limit || 12;
    const offset = options.offset || 0;
    
    return {
      products: results.slice(offset, offset + limit),
      totalCount
    };
  }

  // Fuzzy Search Implementation
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

  let matched: ProductWithRelations[];

  if (queryTokens.length === 0) {
    matched = [];
  } else if (queryTokens.length === 1) {
    matched = fuse.search(queryTokens[0]).map((r) => r.item);
  } else {
    const resultSets = queryTokens.map(
      (token) => new Set(fuse.search(token).map((r) => r.item.id)),
    );
    matched = allProducts.filter((p) => resultSets.every((set) => set.has(p.id)));
  }

  // Apply price filters
  if (options.minPrice !== undefined) {
    matched = matched.filter(p => effectivePrice(p) >= (options.minPrice || 0));
  }
  if (options.maxPrice !== undefined) {
    matched = matched.filter(p => effectivePrice(p) <= (options.maxPrice || Infinity));
  }

  const totalCount = matched.length;
  const limit = options.limit || 12;
  const offset = options.offset || 0;

  return {
    products: matched.slice(offset, offset + limit),
    totalCount
  };
}
