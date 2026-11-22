import { connection } from "next/server";
import { getBranchBySlugAction } from "@/modules/branch/presentation/actions";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildBranchMarkdown, buildPageNotFoundMarkdown } from "@/shared/lib/agent-markdown/render-pages";

// Not a public URL: proxy.ts rewrites `GET /thong-tin/<slug>` here for Markdown clients.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const { data: b } = await getBranchBySlugAction(slug);
  if (!b || !b.isPublished || b.deletedAt) {
    return new Response(buildPageNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS });
  }
  return new Response(buildBranchMarkdown(b), { status: 200, headers: markdownHeaders(`/thong-tin/${b.slug}`) });
}
