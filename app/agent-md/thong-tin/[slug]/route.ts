import { connection } from "next/server";
import { getBranchBySlugAction } from "@/modules/branch/presentation/actions";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildBranchMarkdown, buildPageNotFoundMarkdown } from "@/shared/lib/agent-markdown/render-pages";
import { buildPublicPath } from "@/shared/lib/agent-markdown/fetch-html";
import { servePageMarkdown } from "@/shared/lib/agent-markdown/page-markdown";

// Not a public URL: proxy.ts rewrites `GET /thong-tin/<slug>` here for Markdown clients.
async function legacy(slug: string) {
  const { data: b } = await getBranchBySlugAction(slug);
  if (!b || !b.isPublished || b.deletedAt) {
    return new Response(buildPageNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS });
  }
  return new Response(buildBranchMarkdown(b), { status: 200, headers: markdownHeaders(`/thong-tin/${b.slug}`) });
}

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const legacyForSlug = () => legacy(slug);
  const publicPath = buildPublicPath(["thong-tin", slug]);
  if (!publicPath) return legacyForSlug();
  const res = await servePageMarkdown({ request, publicPath, fallback: legacyForSlug });
  // page-markdown's 404 body is generic; the legacy builder has the right not-found text for this section.
  return res.status === 404 ? legacyForSlug() : res;
}
