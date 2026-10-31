import { connection } from "next/server";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { buildHomeMarkdown, MARKDOWN_HEADERS } from "@/shared/lib/agent-markdown/render";

// Not a public URL: proxy.ts rewrites `GET /` here when the client prefers
// text/markdown over text/html (see shared/lib/agent-markdown/negotiate.ts).
// Same data as the HTML homepage, flattened to Markdown.
export async function GET() {
  await connection();

  const [contacts, branches, categories, brands, services] = await Promise.all([
    getContactsAction(),
    getBranchesAction({ isPublished: true }),
    getCategoriesAction(),
    getBrandsAction({ limit: 100 }),
    getServicesAction({ isPublished: true }),
  ]);

  const body = buildHomeMarkdown({
    contacts: contacts.data,
    branches: branches.data,
    categories: categories.data
      .filter((c) => !c.isHidden)
      .map((c) => ({ name: c.name, slug: c.slug })),
    brands: brands.data,
    services: services.data,
  });

  return new Response(body, { status: 200, headers: MARKDOWN_HEADERS });
}
