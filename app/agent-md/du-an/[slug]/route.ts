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
import { buildPublicPath } from "@/shared/lib/agent-markdown/fetch-html";
import { servePageMarkdown } from "@/shared/lib/agent-markdown/page-markdown";

// Not a public URL: proxy.ts rewrites `GET /du-an/<slug>` here for Markdown
// requests. The slug is either a project or a project type (listing).
async function legacy(slug: string) {
  const entity = await resolveProjectPathFromDb(slug);

  if (entity?.type === "project" && entity.data.isPublished !== false) {
    const project = entity.data;
    // Same rule as the HTML RelatedProjects block: same project type (else all
    // published), minus this one, featured first then orderIndex, first 3.
    const { data: siblings } = await getProjectsAction({
      isPublished: true,
      projectTypeId: project.projectTypeId || undefined,
    });
    let pool = siblings.filter((p) => p.id !== project.id);
    if (pool.length === 0) {
      const { data: all } = await getProjectsAction({ isPublished: true });
      pool = all.filter((p) => p.id !== project.id);
    }
    const related = pool
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.orderIndex - b.orderIndex;
      })
      .slice(0, 3);
    return new Response(buildProjectMarkdown(project, related), {
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

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const legacyForSlug = () => legacy(slug);
  const publicPath = buildPublicPath(["du-an", slug]);
  if (!publicPath) return legacyForSlug();
  const res = await servePageMarkdown({ request, publicPath, fallback: legacyForSlug });
  // page-markdown's 404 body is generic; the legacy builder has the right not-found text for this section.
  return res.status === 404 ? legacyForSlug() : res;
}
