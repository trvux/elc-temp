import { connection } from "next/server";
import { countNewsAction, getNewsAction } from "@/modules/news/presentation/actions";
import { buildNewsIndexMarkdown, NEWS_INDEX_LIMIT } from "@/shared/lib/agent-markdown/render-news";
import { markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { getExcerptFromContent } from "@/shared/lib/rich-text";

// Not a public URL: proxy.ts rewrites `GET /tin-tuc` here for Markdown clients.
export async function GET() {
  await connection();
  const [list, count] = await Promise.all([
    getNewsAction({ isPublished: true, sortBy: "created_at", sortOrder: "desc", limit: NEWS_INDEX_LIMIT + 1 }),
    countNewsAction({ isPublished: true }),
  ]);
  const items = list.data.map((n) => ({
    title: n.title,
    slug: n.slug,
    createdAt: n.createdAt,
    excerpt: getExcerptFromContent(n.content, n.metaDescription) || n.excerpt,
  }));
  const body = buildNewsIndexMarkdown(items, Math.max(count.data, items.length));
  return new Response(body, { status: 200, headers: markdownHeaders("/tin-tuc") });
}
