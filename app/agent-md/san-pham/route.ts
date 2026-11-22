import { connection } from "next/server";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getCatalogPageAction } from "@/modules/catalog/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildProductsIndexMarkdown } from "@/shared/lib/agent-markdown/render-products";

// Not a public URL: proxy.ts rewrites `GET /san-pham` here for Markdown clients.
export async function GET() {
  await connection();

  const [categories, brands, catalogPage] = await Promise.all([
    getCategoriesAction(),
    getBrandsAction({ limit: 100 }),
    getCatalogPageAction(),
  ]);

  const body = buildProductsIndexMarkdown({
    categories: categories.data.filter((c) => !c.isHidden).map((c) => ({ name: c.name, slug: c.slug })),
    brands: brands.data.map((b) => ({ name: b.name, slug: b.slug })),
    content: catalogPage.data?.content,
    metaDescription: catalogPage.data?.metaDescription,
    updatedAt: catalogPage.data?.updatedAt,
  });

  return new Response(body, { status: 200, headers: markdownHeaders("/san-pham") });
}
