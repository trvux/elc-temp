import { connection } from "next/server";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getPagesAction } from "@/modules/page/presentation/actions";
import { markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { buildInfoHubMarkdown } from "@/shared/lib/agent-markdown/render-pages";
import { sortByOrderIndex } from "@/shared/lib/helpers";

// Not a public URL: proxy.ts rewrites `GET /thong-tin` here for Markdown clients.
export async function GET() {
  await connection();
  const [pages, branches] = await Promise.all([getPagesAction(), getBranchesAction({ isPublished: true })]);
  const body = buildInfoHubMarkdown({
    pages: sortByOrderIndex(pages.data.filter((p) => p.isPublished && !p.deletedAt)),
    branches: sortByOrderIndex(branches.data),
  });
  return new Response(body, { status: 200, headers: markdownHeaders("/thong-tin") });
}
