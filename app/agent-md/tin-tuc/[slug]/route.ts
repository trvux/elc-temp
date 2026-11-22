import { connection } from "next/server";
import { getNewsBySlugAction } from "@/modules/news/presentation/actions";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildNewsDetailMarkdown, buildNewsNotFoundMarkdown } from "@/shared/lib/agent-markdown/render-news";

// Not a public URL: proxy.ts rewrites `GET /tin-tuc/<slug>` here for Markdown clients.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const { data: n } = await getNewsBySlugAction(slug);
  if (!n || !n.isPublished || n.deletedAt) {
    return new Response(buildNewsNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS });
  }
  const body = buildNewsDetailMarkdown({
    title: n.title,
    slug: n.slug,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    excerpt: n.excerpt,
    metaDescription: n.metaDescription,
    content: n.content,
  });
  return new Response(body, { status: 200, headers: markdownHeaders(`/tin-tuc/${n.slug}`) });
}
