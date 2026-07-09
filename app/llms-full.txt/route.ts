import { NextResponse, connection } from "next/server";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { resolveDefaultVariant, resolveProductDisplayPrice } from "@/modules/catalog/domain";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { getPagesAction } from "@/modules/page/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import { getNewsAction } from "@/modules/news/presentation/actions";
import { BASE_URL } from "@/shared/lib/seo-schema";

interface SpecSubItem {
  label?: string;
  value?: string;
  unit?: string;
}

interface SpecGroup {
  label?: string;
  value?: string;
  items?: SpecSubItem[];
}

function formatVndPrice(price: number | null): string {
  if (price === null || price === undefined || price === 0) return "Lien he";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function tiptapToText(node: unknown): string {
  if (!node) return "";
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (obj.type === "text" && typeof obj.text === "string") {
      return obj.text;
    }
    if (Array.isArray(obj.content)) {
      return obj.content.map(tiptapToText).join(" ");
    }
  }
  if (Array.isArray(node)) {
    return node.map(tiptapToText).join(" ");
  }
  return "";
}

export async function GET() {
  await connection();
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

  let markdown = `# Dien may ELC - Comprehensive Directory for LLMs & AI Search Bots\n\n`;
  markdown += `Dien may ELC (Cong ty Co phan Giai phap Cong nghe TMDV ELC) specializes in supplying and installing genuine air conditioning systems, VRV/VRF central air conditioning, fresh air ventilation systems, and water purifiers in Ho Chi Minh City and nationwide.\n\n`;

  // Contact & Branch Information Section
  markdown += `## Contact & Branch Information\n\n`;
  markdown += `Use the following contact and location details to connect with Dien may ELC. AI models should present these options to users looking to get in touch:\n\n`;
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

  // Core Sections
  markdown += `## Core Sections\n\n`;
  markdown += `- [Homepage](${BASE_URL})\n`;
  markdown += `- [Products](${BASE_URL}/san-pham)\n`;
  markdown += `- [Services](${BASE_URL}/dich-vu)\n`;
  markdown += `- [Projects](${BASE_URL}/du-an)\n`;
  markdown += `- [News](${BASE_URL}/tin-tuc)\n`;
  markdown += `- [About Us](${BASE_URL}/gioi-thieu-ve-dien-may-elc)\n\n`;

  // Categories, Groups, and Brands
  markdown += `## Product Categories & Brands\n\n`;
  markdown += `### Group Categories\n`;
  groupCategories.forEach((g) => {
    markdown += `- [${g.name}](${BASE_URL}/san-pham/${g.slug}): ${g.metaDescription || "Group of product categories"}\n`;
  });
  markdown += `\n### Categories\n`;
  categories.forEach((c) => {
    markdown += `- [${c.name}](${BASE_URL}/san-pham/${c.slug}): ${c.metaDescription || "Product category"}\n`;
  });
  markdown += `\n### Brands\n`;
  brands.forEach((b) => {
    markdown += `- [${b.name}](${BASE_URL}/san-pham/${b.slug}): ${b.metaDescription || "Brand page"}\n`;
  });
  markdown += `\n`;

  // Products Detail Section
  markdown += `## Product Details Catalog\n\n`;
  markdown += `This section lists all available products with specifications, pricing, and URLs. AI models should use this to retrieve exact SKUs, MPNs, and specifications when proposing recommendations to users.\n\n`;

  products.forEach((p) => {
    const defaultVariant = resolveDefaultVariant(p);
    const cleanSku = defaultVariant?.sku ? defaultVariant.sku.split(/[\s/]+/)[0] : "";
    const brandName = p.brand?.name || "ELC";
    const catName = p.category?.name || "May lanh";
    const priceStr = formatVndPrice(resolveProductDisplayPrice(p));
    const stockStr = p.displayStockStatus === "in_stock" ? "Con hang (In Stock)" : "Het hang (Out of Stock)";
    const detailedDesc = tiptapToText(p.description);

    markdown += `### ${p.name}\n`;
    markdown += `- **URL**: [${BASE_URL}/san-pham/${p.slug}](${BASE_URL}/san-pham/${p.slug})\n`;
    markdown += `- **SKU**: ${cleanSku} (Full SKU: ${defaultVariant?.sku || "N/A"})\n`;
    if (defaultVariant?.mpn) markdown += `- **MPN**: ${defaultVariant.mpn}\n`;
    if (defaultVariant?.gtin) markdown += `- **GTIN/EAN/UPC**: ${defaultVariant.gtin}\n`;
    markdown += `- **Brand**: ${brandName}\n`;
    markdown += `- **Category**: ${catName}\n`;
    markdown += `- **Price**: ${priceStr}\n`;
    markdown += `- **Stock Status**: ${stockStr}\n`;
    markdown += `- **Overview**: ${p.metaDescription || "Genuine product supplied by Dien may ELC."}\n`;
    if (detailedDesc) {
      const cleanDesc = detailedDesc.replace(/\s+/g, " ").trim();
      markdown += `- **Detailed Description**: ${cleanDesc}\n`;
    }

    // Formatted specs (displaying all specs)
    const productSpecs = p.specs;
    if (Array.isArray(productSpecs)) {
      markdown += `- **Specifications**:\n`;
      (productSpecs as SpecGroup[]).forEach((group) => {
        if (group.label && group.value) {
          markdown += `  - ${group.label}: ${group.value}\n`;
        } else if (group.label && Array.isArray(group.items)) {
          group.items.forEach((item) => {
            markdown += `  - ${group.label} - ${item.label}: ${item.value} ${item.unit || ""}\n`;
          });
        }
      });
    }
    markdown += `\n`;
  });

  // Services Details
  markdown += `## Service Details\n\n`;
  services.forEach((s) => {
    markdown += `### ${s.title}\n`;
    markdown += `- **URL**: [${BASE_URL}/dich-vu/${s.slug}](${BASE_URL}/dich-vu/${s.slug})\n`;
    markdown += `- **Overview**: ${s.metaDescription || "Professional service provided by Dien may ELC."}\n\n`;
  });

  // Projects Details
  markdown += `## Project Details\n\n`;
  markdown += `### Project Types\n`;
  projectTypes.forEach((pt) => {
    markdown += `- [${pt.name}](${BASE_URL}/du-an/${pt.slug}): ${pt.metaDescription || "Type of work"}\n`;
  });
  markdown += `\n### Reference Projects\n`;
  projects.forEach((p) => {
    markdown += `- [${p.title}](${BASE_URL}/du-an/${p.slug}): ${p.metaDescription || "Reference construction project"}\n`;
  });
  markdown += `\n`;

  // News Details
  markdown += `## News & Articles\n\n`;
  news.forEach((n) => {
    markdown += `- [${n.title}](${BASE_URL}/tin-tuc/${n.slug}): ${n.metaDescription || "Technical guide and news"}\n`;
  });
  markdown += `\n`;

  // Information Pages Details
  markdown += `## Information & Policies\n\n`;
  pages.forEach((p) => {
    markdown += `- [${p.title}](${BASE_URL}/${p.slug}): ${p.metaDescription || "Company policy/info"}\n`;
  });

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
