import { connection } from "next/server";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getFAQsAction } from "@/modules/faq";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getNewsAction, getNewsBySlugAction } from "@/modules/news/presentation/actions";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { matchLinksByName, type NamedLink } from "@/shared/lib/content-relevance";
import type { NewsDetailExtras } from "@/shared/lib/agent-markdown/render-news";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildNewsDetailMarkdown, buildNewsNotFoundMarkdown } from "@/shared/lib/agent-markdown/render-news";

const RELATED_PRODUCTS_PREVIEW = 15;

// Mirrors getCachedNewsDetailData in app/(public)/tin-tuc/[slug]/page.tsx.
async function loadRelated(slug: string) {
  const empty: NewsDetailExtras = {};
  const allNews = await getNewsAction({ isPublished: true }).then(unwrapActionResult);
  const item = (allNews ?? []).find((x) => x.slug === slug);
  if (!item) return empty;
  const same = item.categoryId ? allNews.filter((x) => x.categoryId === item.categoryId && x.slug !== slug) : [];
  const fallback = allNews.filter((x) => x.slug !== slug && (!item.categoryId || x.categoryId !== item.categoryId));
  const relatedNews = [...same, ...fallback].slice(0, 3);

  const [allCategories, groupsRes] = await Promise.all([
    getCategoriesAction().then(unwrapActionResult),
    getGroupsAction(),
  ]);
  type Candidate = NamedLink & { id: string; type: "category" | "group" };
  const candidates: Candidate[] = [
    ...allCategories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, type: "category" as const })),
    ...(groupsRes.data || []).map((g) => ({ id: g.id, name: g.name, slug: g.slug, type: "group" as const })),
  ];
  const matched = item.categoryId
    ? candidates.find((c) => c.type === "category" && c.id === item.categoryId)
    : matchLinksByName(item.title, candidates, 1)[0];
  let relatedProducts: NewsDetailExtras["relatedProducts"] = [];
  let relatedProductsTotal = 0;
  let relatedProductsEntity: { slug: string } | null = null;
  if (matched) {
    const categoryIds =
      matched.type === "category"
        ? [matched.id]
        : allCategories.filter((c) => c.groupId === matched.id && !c.isHidden).map((c) => c.id);
    if (categoryIds.length > 0) {
      const { data, totalCount } = await getProductsAction({
        categoryIds,
        status: PRODUCT_STATUS.PUBLISHED,
        limit: RELATED_PRODUCTS_PREVIEW,
        offset: 0,
      });
      relatedProducts = data;
      relatedProductsTotal = totalCount;
      relatedProductsEntity = matched;
    }
  }
  return { relatedNews, relatedProducts, relatedProductsEntity, relatedProductsTotal };
}

// Not a public URL: proxy.ts rewrites `GET /tin-tuc/<slug>` here for Markdown clients.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const { data: n } = await getNewsBySlugAction(slug);
  if (!n || !n.isPublished || n.deletedAt) {
    return new Response(buildNewsNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS });
  }
  const [{ data: faqs }, related] = await Promise.all([getFAQsAction("news", n.id), loadRelated(slug)]);
  const body = buildNewsDetailMarkdown({
    title: n.title,
    slug: n.slug,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    excerpt: n.excerpt,
    metaDescription: n.metaDescription,
    content: n.content,
  }, { faqs, ...related });
  return new Response(body, { status: 200, headers: markdownHeaders(`/tin-tuc/${n.slug}`) });
}
