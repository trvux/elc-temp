import { searchProducts } from "@/modules/catalog/application";
import { productRepo } from "@/modules/catalog/infrastructure/SupabaseProductRepository";
import { createClient } from "@/shared/lib/supabase/server";
import { unstable_cache } from "next/cache";
import type { NextRequest } from "next/server";

// Cache category IDs for a group (stable — changes only on admin edit)
const getCachedGroupCategoryIds = unstable_cache(
  async (groupId: string): Promise<string[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("group_id", groupId)
      .is("deleted_at", null);

    return (data ?? [])
      .filter((c) => !c.name.toLowerCase().includes("chưa phân loại"))
      .map((c) => c.id);
  },
  ["group-category-ids"],
  { revalidate: 86400, tags: ["categories"] },
);

type FilterParams = {
  q: string;
  categoryIds: string[];
  brandIds: string[];
  brandSlugs: string[];
  minPrice: number | null;
  maxPrice: number | null;
  specs: Record<string, string[]>;
  condition: string | null;
};

// Cache ALL products for a given filter combo — pagination is done in-memory after.
// One cache entry covers every offset/limit page of the same filter set.
const getAllFilteredProducts = unstable_cache(
  async (params: FilterParams) => {
    const { products } = await searchProducts(productRepo, params.q, {
      isPublished: true,
      categoryIds: params.categoryIds.length > 0 ? params.categoryIds : undefined,
      brandIds: params.brandIds.length > 0 ? params.brandIds : undefined,
      brandSlugs: params.brandSlugs.length > 0 ? params.brandSlugs : undefined,
      minPrice: params.minPrice ?? undefined,
      maxPrice: params.maxPrice ?? undefined,
      specs: params.specs,
      condition: params.condition ?? undefined,
      limit: 10000,
      offset: 0,
    });
    return products;
  },
  ["api-products-filtered"],
  { revalidate: 3600, tags: ["products"] },
);

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const q = sp.get("q") ?? "";
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? "12"), 4), 80);
  const offset = Math.max(0, Number(sp.get("offset") ?? "0"));

  const brandSlugs = sp.getAll("brands");
  const brandIds = sp.getAll("brandIds");

  const specs: Record<string, string[]> = {};
  sp.forEach((value, key) => {
    if (key.startsWith("spec_")) {
      const label = key.slice(5);
      if (!specs[label]) specs[label] = [];
      specs[label].push(value);
    }
  });

  const entityType = sp.get("entityType") as "category" | "brand" | "group" | null;
  const entityId = sp.get("entityId");

  let categoryIds: string[] = [];
  let repoBrandIds: string[] = [];

  if (entityType && entityId) {
    if (entityType === "brand") {
      repoBrandIds = [entityId];
    } else if (entityType === "category") {
      categoryIds = [entityId];
    } else if (entityType === "group") {
      categoryIds = await getCachedGroupCategoryIds(entityId);
    }
  }

  const allBrandIds = [...repoBrandIds, ...brandIds];

  const filterParams: FilterParams = {
    q,
    categoryIds,
    brandIds: allBrandIds,
    brandSlugs,
    minPrice: sp.has("minPrice") ? Number(sp.get("minPrice")) : null,
    maxPrice: sp.has("maxPrice") ? Number(sp.get("maxPrice")) : null,
    specs,
    condition: sp.get("condition"),
  };

  try {
    const allProducts = await getAllFilteredProducts(filterParams);
    const totalCount = allProducts.length;
    const products = allProducts.slice(offset, offset + limit);
    const hasMore = offset + products.length < totalCount;

    return Response.json(
      { products, totalCount, hasMore, offset },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    console.error("[/api/products] Error:", err);
    return Response.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
