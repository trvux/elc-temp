import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { unstable_cache } from "next/cache";
import type { NextRequest } from "next/server";

// Cache category IDs for a group (stable — changes only on admin edit)
const getCachedGroupCategoryIds = unstable_cache(
  async (groupId: string): Promise<string[]> => {
    const { data } = await getCategoriesAction({ groupId });

    return data
      .filter((c) => !c.name.toLowerCase().includes("chưa phân loại"))
      .map((c) => c.id);
  },
  ["group-category-ids"],
  { revalidate: 86400, tags: ["categories"] },
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

  try {
    // Go handles filtered LIMIT/OFFSET pagination efficiently at the SQL layer
    // (unlike the old fetch-everything-then-slice-in-memory approach this route
    // used to need), so each page is queried directly per request rather than
    // caching the whole filtered set — a per-offset unstable_cache key here
    // would just multiply cache entries for little benefit.
    const { data: products, totalCount, error } = await getProductsAction({
      search: q || undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      brandIds: allBrandIds.length > 0 ? allBrandIds : undefined,
      brandSlugs: brandSlugs.length > 0 ? brandSlugs : undefined,
      minPrice: sp.has("minPrice") ? Number(sp.get("minPrice")) : undefined,
      maxPrice: sp.has("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
      specs,
      condition: sp.get("condition") || undefined,
      isPublished: true,
      limit,
      offset,
    });

    if (error) {
      throw new Error(error);
    }

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
