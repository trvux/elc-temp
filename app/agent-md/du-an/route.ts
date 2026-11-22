import { connection } from "next/server";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { markdownHeaders } from "@/shared/lib/agent-markdown/render";
import {
  buildProjectIndexMarkdown,
  PROJECT_INDEX_LIMIT,
} from "@/shared/lib/agent-markdown/render-projects";

// Not a public URL: proxy.ts rewrites `GET /du-an` here for Markdown requests.
export async function GET() {
  await connection();
  const { data } = await getProjectsAction({ isPublished: true, limit: PROJECT_INDEX_LIMIT + 1 });
  const body = buildProjectIndexMarkdown(data.filter((p) => p.isPublished !== false));
  return new Response(body, { status: 200, headers: markdownHeaders("/du-an") });
}
