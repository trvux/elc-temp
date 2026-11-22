import { connection } from "next/server";
import { PRODUCT_STATUS, resolveDefaultVariant } from "@/modules/catalog/domain";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getCatalogPageAction, getProductsAction } from "@/modules/catalog/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildProductsIndexMarkdown } from "@/shared/lib/agent-markdown/render-products";
import { servePageMarkdown } from "@/shared/lib/agent-markdown/page-markdown";

const INITIAL_PER_SECTION = 5;

// Not a public URL: proxy.ts rewrites `GET /san-pham` here for Markdown clients.
async function legacy() {
  await connection();

  const [categories, brands, catalogPage] = await Promise.all([
    getCategoriesAction(),
    getBrandsAction({ limit: 100 }),
    getCatalogPageAction(),
  ]);

  // Same data/filters/order as app/(public)/san-pham/page.tsx (INITIAL_PER_SECTION = 5).
  const catOrder = new Map<string, number>();
  categories.data.forEach((cat, i) => {
    const groupOrder = (cat as { group?: { orderIndex?: number } }).group?.orderIndex ?? 999;
    catOrder.set(cat.id, groupOrder * 1000 + (cat.orderIndex ?? i));
  });
  const fetched = await Promise.all(
    categories.data.map(async (cat) => {
      const { data, totalCount, error } = await getProductsAction({
        categoryId: cat.id,
        status: PRODUCT_STATUS.PUBLISHED,
        limit: INITIAL_PER_SECTION,
        offset: 0,
      });
      if (error) throw new Error(error);
      return { cat, data, totalCount };
    }),
  );
  const sections = fetched
    .filter((s) => s.totalCount > 0)
    .sort((a, b) => (catOrder.get(a.cat.id) ?? 999999) - (catOrder.get(b.cat.id) ?? 999999))
    .map(({ cat, data, totalCount }) => ({
      name: cat.name,
      slug: cat.slug,
      groupName: cat.group?.name ?? null,
      groupSlug: cat.group?.slug ?? null,
      totalCount,
      products: data.map((p) => ({
        name: p.name,
        slug: p.slug,
        displayPrice: p.displayPrice,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        compareAtPrice: resolveDefaultVariant(p)?.originalPrice ?? null,
      })),
    }));

  const body = buildProductsIndexMarkdown({
    sections,
    categories: categories.data.filter((c) => !c.isHidden).map((c) => ({ name: c.name, slug: c.slug })),
    brands: brands.data.map((b) => ({ name: b.name, slug: b.slug })),
    content: catalogPage.data?.content,
    metaDescription: catalogPage.data?.metaDescription,
    updatedAt: catalogPage.data?.updatedAt,
  });

  return new Response(body, { status: 200, headers: markdownHeaders("/san-pham") });
}

export async function GET(request: Request) {
  await connection();
  return servePageMarkdown({ request, publicPath: "/san-pham", fallback: legacy });
}
