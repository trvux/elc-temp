import { connection } from "next/server";
import { getPageBySlugAction } from "@/modules/page/presentation/actions";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildPageNotFoundMarkdown, buildStaticPageMarkdown } from "@/shared/lib/agent-markdown/render-pages";
import { buildPublicPath } from "@/shared/lib/agent-markdown/fetch-html";
import { servePageMarkdown } from "@/shared/lib/agent-markdown/page-markdown";

// Not a public URL: proxy.ts rewrites any non-reserved top-level slug (see
// isCmsPageSlug in routes.ts) here for Markdown clients.
async function legacy(slug: string) {
  const { data: p } = await getPageBySlugAction(slug);
  if (!p || !p.isPublished || p.deletedAt) {
    return new Response(buildPageNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS });
  }
  return new Response(buildStaticPageMarkdown(p), { status: 200, headers: markdownHeaders(`/${p.slug}`) });
}

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const legacyForSlug = () => legacy(slug);
  const publicPath = buildPublicPath([slug]);
  if (!publicPath) return legacyForSlug();
  const res = await servePageMarkdown({ request, publicPath, fallback: legacyForSlug });
  // page-markdown's 404 body is generic; the legacy builder has the right not-found text for this section.
  return res.status === 404 ? legacyForSlug() : res;
}
