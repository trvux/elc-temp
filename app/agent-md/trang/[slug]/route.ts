import { connection } from "next/server";
import { getPageBySlugAction } from "@/modules/page/presentation/actions";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildPageNotFoundMarkdown, buildStaticPageMarkdown } from "@/shared/lib/agent-markdown/render-pages";

// Not a public URL: proxy.ts rewrites any non-reserved top-level slug (see
// isCmsPageSlug in routes.ts) here for Markdown clients.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const { data: p } = await getPageBySlugAction(slug);
  if (!p || !p.isPublished || p.deletedAt) {
    return new Response(buildPageNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS });
  }
  return new Response(buildStaticPageMarkdown(p), { status: 200, headers: markdownHeaders(`/${p.slug}`) });
}
