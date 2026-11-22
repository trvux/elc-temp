import { connection } from "next/server";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { resolveProjectPathFromDb } from "@/modules/project/presentation/resolveProjectPath";
import { MARKDOWN_HEADERS, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import {
  buildProjectIndexMarkdown,
  buildProjectMarkdown,
  buildProjectNotFoundMarkdown,
  PROJECT_INDEX_LIMIT,
} from "@/shared/lib/agent-markdown/render-projects";

// Not a public URL: proxy.ts rewrites `GET /du-an/<slug>` here for Markdown
// requests. The slug is either a project or a project type (listing).
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const entity = await resolveProjectPathFromDb(slug);

  if (entity?.type === "project" && entity.data.isPublished !== false) {
    return new Response(buildProjectMarkdown(entity.data), {
      status: 200,
      headers: markdownHeaders(`/du-an/${slug}`),
    });
  }

  if (entity?.type === "project_type") {
    const { data } = await getProjectsAction({
      projectTypeId: entity.data.id,
      isPublished: true,
      limit: PROJECT_INDEX_LIMIT + 1,
    });
    const body = buildProjectIndexMarkdown(data, {
      heading: `Dự án ${entity.data.name}`,
      canonicalPath: `/du-an/${slug}`,
    });
    return new Response(body, { status: 200, headers: markdownHeaders(`/du-an/${slug}`) });
  }

  return new Response(buildProjectNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS });
}
