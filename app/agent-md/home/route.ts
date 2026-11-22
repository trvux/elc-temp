import { connection } from "next/server";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getNewsAction } from "@/modules/news/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { buildHomeMarkdown, markdownHeaders } from "@/shared/lib/agent-markdown/render";
import { servePageMarkdown } from "@/shared/lib/agent-markdown/page-markdown";

// Not a public URL: proxy.ts rewrites `GET /` here when the client prefers
// text/markdown over text/html (see shared/lib/agent-markdown/negotiate.ts).
// Same data as the HTML homepage, flattened to Markdown.
async function legacy() {

  const [contacts, branches, categories, brands, services, projects, news] = await Promise.all([
    getContactsAction(),
    getBranchesAction({ isPublished: true }),
    getCategoriesAction(),
    getBrandsAction({ limit: 100 }),
    getServicesAction({ isPublished: true }),
    getProjectsAction({ isPublished: true, orderBy: "orderIndex", orderDirection: "asc" }).then(unwrapActionResult),
    getNewsAction({ isPublished: true, limit: 3, sortBy: "created_at", sortOrder: "desc" }).then(unwrapActionResult),
  ]);
  // Same selection as app/(public)/page.tsx.
  const featured = [...projects].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)).slice(0, 6);

  const body = buildHomeMarkdown({
    contacts: contacts.data,
    branches: branches.data,
    categories: categories.data
      .filter((c) => !c.isHidden)
      .map((c) => ({ name: c.name, slug: c.slug })),
    brands: brands.data,
    services: services.data,
    projectCount: projects.length,
    projects: featured.map((p) => ({ title: p.title, slug: p.slug })),
    news: news.map((n) => ({ title: n.title, slug: n.slug, excerpt: n.excerpt })),
  });

  return new Response(body, { status: 200, headers: markdownHeaders("/") });
}

export async function GET(request: Request) {
  await connection();
  const res = await servePageMarkdown({ request, publicPath: "/", fallback: legacy });
  return res.status === 404 ? legacy() : res;
}
