import { connection } from "next/server";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { resolveProductPathFromDb } from "@/modules/catalog/presentation/resolveProductPath";
import { getRelatedProducts } from "@/modules/catalog/presentation/getRelatedProducts";
import { getFAQsAction } from "@/modules/faq";
import { getReviewsAction } from "@/modules/review";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import {
  buildProductListMarkdown,
  buildProductMarkdown,
  buildProductNotFoundMarkdown,
  PRODUCT_LIST_CAP,
} from "@/shared/lib/agent-markdown/render-products";

// Not a public URL: proxy.ts rewrites `GET /san-pham/<slug>` here for Markdown
// clients. Mirrors app/(public)/san-pham/[slug]/page.tsx: same slug resolution,
// same 404 cases (unknown slug, archived product, product without category).
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;

  const notFound = () =>
    new Response(buildProductNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS });

  const resolved = await resolveProductPathFromDb(slug);
  if (!resolved) return notFound();
  const headers = markdownHeaders(`/san-pham/${slug}`);

  if (resolved.type === "product") {
    const product = resolved.data;
    if (product.status === PRODUCT_STATUS.ARCHIVED || !product.category) return notFound();
    const [related, { data: reviews, aggregate }, { data: faqs }] = await Promise.all([
      getRelatedProducts(product),
      getReviewsAction("product", product.id),
      getFAQsAction("product", product.id),
    ]);
    return new Response(buildProductMarkdown(product, { faqs, reviews, aggregate, related }), { status: 200, headers });
  }

  // Same product scoping as ProductListModule (without visitor filters).
  let categoryIds: string[] | undefined;
  let brandIds: string[] | undefined;
  let attributeTokens: Record<string, string[]> | undefined;
  let childCategories: Array<{ name: string; slug: string }> | undefined;

  if (resolved.type === "brand") {
    brandIds = [resolved.data.id];
  } else if (resolved.type === "category") {
    categoryIds = [resolved.data.id];
  } else if (resolved.type === "group") {
    const all = (await getCategoriesAction()).data;
    const children = all.filter((c) => c.groupId === resolved.data.id && !c.isHidden);
    categoryIds = children.map((c) => c.id);
    childCategories = children.map((c) => ({ name: c.name, slug: c.slug }));
  } else {
    const d = resolved.data;
    if (d.attributeCode) attributeTokens = { [d.attributeCode]: d.attributeValues };
    if (d.categoryIds.length > 0) categoryIds = d.categoryIds;
    if (d.brandIds.length > 0) brandIds = d.brandIds;
  }

  const { data: products, totalCount } = await getProductsAction({
    categoryIds,
    brandIds,
    attributeTokens,
    status: PRODUCT_STATUS.PUBLISHED,
    limit: PRODUCT_LIST_CAP,
  });

  const d = resolved.data;
  const body = buildProductListMarkdown({
    entity: {
      type: resolved.type,
      name: d.name,
      slug: d.slug,
      imageUrl: resolved.type === "brand" ? resolved.data.logoUrl : resolved.data.imageUrl,
      metaTitle: d.metaTitle,
      metaDescription: d.metaDescription,
      content: d.content,
      updatedAt: d.updatedAt,
      isHidden: (resolved.type === "category" || resolved.type === "group") && resolved.data.isHidden,
    },
    products,
    totalCount,
    childCategories,
  });
  return new Response(body, { status: 200, headers });
}
