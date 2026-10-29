import { connection } from "next/server";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { buildHomeMarkdown, MARKDOWN_HEADERS } from "@/shared/lib/agent-markdown/render";

// Not a public URL: proxy.ts rewrites `GET /` here when the client prefers
// text/markdown over text/html (see shared/lib/agent-markdown/negotiate.ts).
// Same data as the HTML homepage, flattened to Markdown.
export async function GET() {
  await connection();

  const [contacts, branches, categories, brands, services, projects] = await Promise.all([
    getContactsAction(),
    getBranchesAction({ isPublished: true }),
    getCategoriesAction(),
    getBrandsAction({ limit: 100 }),
    getServicesAction({ isPublished: true }),
    getProjectsAction({ isPublished: true, limit: 200 }),
  ]);

  const categoriesWithProducts = await Promise.all(
    categories.data.map(async (category) => {
      const { data: products } = await getProductsAction({
        status: PRODUCT_STATUS.PUBLISHED,
        categoryId: category.id,
        limit: 12,
        offset: 0,
      });
      return { name: category.name, slug: category.slug, products: products ?? [] };
    }),
  );

  const body = buildHomeMarkdown({
    contacts: contacts.data,
    branches: branches.data,
    categories: categoriesWithProducts.filter((c) => c.products.length > 0),
    brands: brands.data,
    services: services.data,
    projects: projects.data.filter((p) => p.isFeatured).slice(0, 15),
  });

  return new Response(body, { status: 200, headers: MARKDOWN_HEADERS });
}
