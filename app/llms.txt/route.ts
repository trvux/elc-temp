import { NextResponse, connection } from "next/server";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { resolveDefaultVariant } from "@/modules/catalog/domain";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { getPagesAction } from "@/modules/page/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import { getNewsAction } from "@/modules/news/presentation/actions";
import { BASE_URL } from "@/shared/lib/seo-schema";

export async function GET(request: Request) {
  await connection();
  // Accessing request properties forces the route to be evaluated dynamically at runtime
  const url = new URL(request.url);
  url.searchParams.get("cb");

  const [
    { data: allContacts },
    { data: branches },
    { data: categories },
    { data: brands },
    { data: groupCategories },
    { data: products },
    { data: services },
    { data: allPages },
    { data: projects },
    { data: projectTypes },
    { data: news },
  ] = await Promise.all([
    getContactsAction(),
    getBranchesAction({ isPublished: true }),
    getCategoriesAction(),
    getBrandsAction(),
    getGroupsAction(),
    getProductsAction({ isPublished: true }),
    getServicesAction({ isPublished: true }),
    getPagesAction(),
    getProjectsAction({ isPublished: true }),
    getProjectTypesAction(),
    getNewsAction({ isPublished: true }),
  ]);

  const contacts = allContacts.filter((c) => c.isActive);
  const pages = allPages.filter((p) => p.isPublished);

  let markdown = `# Dien may ELC - Sitemap for LLMs & AI Search Bot\n\n`;
  markdown += `Dien may ELC (Cong ty Co phan Giai phap Cong nghe TMDV ELC) specializes in supplying and installing genuine air conditioning systems, VRV/VRF central air conditioning, fresh air ventilation systems, and water purifiers in Ho Chi Minh City and nationwide.\n\n`;
  markdown += `For a comprehensive directory including detailed product specifications, pricing, stock statuses, and descriptions, see the [Full Specification](${BASE_URL}/llms-full.txt).\n\n`;

  // Contact Information Section
  markdown += `## Contact & Branch Information\n\n`;
  markdown += `Use the following contact and location details to connect with Dien may ELC:\n\n`;
  if (contacts.length > 0) {
    contacts.forEach((c) => {
      markdown += `- **${c.label} (${c.type})**: ${c.value}\n`;
    });
  }
  if (branches.length > 0) {
    markdown += `\n### Office & Branch Locations\n\n`;
    branches.forEach((b) => {
      markdown += `- **${b.name}**:\n`;
      markdown += `  - Address: ${b.address}\n`;
      if (b.phone) markdown += `  - Phone: ${b.phone}\n`;
      if (b.email) markdown += `  - Email: ${b.email}\n`;
      if (b.description) markdown += `  - Description: ${b.description}\n`;
    });
  }
  markdown += `\n`;

  markdown += `## Core Sections\n\n`;
  markdown += `- [Homepage](${BASE_URL}): Official website of Dien may ELC.\n`;
  markdown += `- [Products](${BASE_URL}/san-pham): All products catalog.\n`;
  markdown += `- [Services](${BASE_URL}/dich-vu): Professional installation, maintenance, and repair services.\n`;
  markdown += `- [Projects](${BASE_URL}/du-an): Portfolio of ELC air conditioning & HVAC projects.\n`;
  markdown += `- [News](${BASE_URL}/tin-tuc): Technical guides and news.\n`;
  markdown += `- [About Us](${BASE_URL}/gioi-thieu-ve-dien-may-elc): Contact and company overview.\n\n`;

  // Categories, Groups, and Brands
  markdown += `## Product Categories & Brands\n\n`;
  groupCategories.forEach((g) => {
    markdown += `- [Group: ${g.name}](${BASE_URL}/san-pham/${g.slug})\n`;
  });
  categories.forEach((c) => {
    markdown += `- [Category: ${c.name}](${BASE_URL}/san-pham/${c.slug})\n`;
  });
  brands.forEach((b) => {
    markdown += `- [Brand: ${b.name}](${BASE_URL}/san-pham/${b.slug})\n`;
  });
  markdown += `\n`;

  // Products
  markdown += `## Products (Flat URLs)\n\n`;
  products.forEach((p) => {
    const defaultVariant = resolveDefaultVariant(p);
    const cleanSku = defaultVariant?.sku ? defaultVariant.sku.split(/[\s/]+/)[0] : "";
    const mpnStr = defaultVariant?.mpn ? ` | MPN: ${defaultVariant.mpn}` : "";
    markdown += `- [${p.name} - SKU: ${cleanSku}${mpnStr}](${BASE_URL}/san-pham/${p.slug})\n`;
  });
  markdown += `\n`;

  // Services
  markdown += `## Services\n\n`;
  services.forEach((s) => {
    markdown += `- [Service: ${s.title}](${BASE_URL}/dich-vu/${s.slug})\n`;
  });
  markdown += `\n`;

  // Projects
  markdown += `## Projects & Project Types\n\n`;
  projectTypes.forEach((pt) => {
    markdown += `- [Project Type: ${pt.name}](${BASE_URL}/du-an/${pt.slug})\n`;
  });
  projects.forEach((p) => {
    markdown += `- [Project: ${p.title}](${BASE_URL}/du-an/${p.slug})\n`;
  });
  markdown += `\n`;

  // News
  markdown += `## News & Articles\n\n`;
  news.forEach((n) => {
    markdown += `- [News: ${n.title}](${BASE_URL}/tin-tuc/${n.slug})\n`;
  });
  markdown += `\n`;

  // Pages
  markdown += `## Information & Pages\n\n`;
  pages.forEach((p) => {
    markdown += `- [Info: ${p.title}](${BASE_URL}/${p.slug})\n`;
  });

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
