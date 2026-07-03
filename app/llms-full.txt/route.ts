import { NextResponse } from "next/server";
import { createStaticClient } from "@/shared/lib/supabase/static";

const BASE_URL = "https://dienmayelc.com.vn";

interface SpecItem {
  label?: string;
  value?: string;
  unit?: string;
}

interface SpecGroup {
  label?: string;
  value?: string;
  items?: SpecItem[];
}

interface DBBrand {
  name: string | null;
}

interface DBCategory {
  name: string | null;
}

interface DBProduct {
  slug: string;
  name: string;
  sku: string | null;
  mpn: string | null;
  gtin: string | null;
  sale_price: number | null;
  original_price: number | null;
  stock_status: string | null;
  meta_description: string | null;
  description: unknown;
  specs: SpecGroup[] | null;
  brands: DBBrand | DBBrand[] | null;
  categories: DBCategory | DBCategory[] | null;
}

function getSingleRelationName(rel: unknown): string {
  if (!rel) return "";
  if (Array.isArray(rel)) {
    return rel[0]?.name || "";
  }
  return (rel as { name?: string }).name || "";
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
  const supabase = createStaticClient();

  // Fetch Contacts
  const { data: contacts } = await supabase
    .from("contacts")
    .select("type, label, value")
    .eq("is_active", true)
    .order("order_index");

  // Fetch Branches
  const { data: branches } = await supabase
    .from("branches")
    .select("slug, name, address, phone, email, description")
    .eq("is_published", true)
    .is("deleted_at", null);

  // Fetch Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name, meta_description")
    .is("deleted_at", null);

  // Fetch Brands
  const { data: brands } = await supabase
    .from("brands")
    .select("slug, name, meta_description")
    .is("deleted_at", null);

  // Fetch Group Categories
  const { data: groupCategories } = await supabase
    .from("group_categories")
    .select("slug, name, meta_description")
    .is("deleted_at", null);

  // Fetch Products with relations
  const { data: products } = await supabase
    .from("products")
    .select("slug, name, sku, mpn, gtin, sale_price, original_price, stock_status, meta_description, description, specs, brands(name), categories(name)")
    .eq("is_published", true)
    .is("deleted_at", null) as { data: DBProduct[] | null };

  // Fetch Services
  const { data: services } = await supabase
    .from("services")
    .select("slug, title, meta_description")
    .eq("is_published", true)
    .is("deleted_at", null);

  // Fetch Pages
  const { data: pages } = await supabase
    .from("pages")
    .select("slug, title, meta_description")
    .eq("is_published", true)
    .is("deleted_at", null);

  // Fetch Projects
  const { data: projects } = await supabase
    .from("projects")
    .select("slug, title, meta_description")
    .eq("is_published", true)
    .is("deleted_at", null);

  // Fetch Project Types
  const { data: projectTypes } = await supabase
    .from("project_type")
    .select("slug, name, meta_description")
    .is("deleted_at", null);

  // Fetch News
  const { data: news } = await supabase
    .from("news")
    .select("slug, title, meta_description")
    .eq("is_published", true)
    .is("deleted_at", null);

  let markdown = `# Dien may ELC - Comprehensive Directory for LLMs & AI Search Bots\n\n`;
  markdown += `Dien may ELC (Cong ty Co phan Giai phap Cong nghe TMDV ELC) specializes in supplying and installing genuine air conditioning systems, VRV/VRF central air conditioning, fresh air ventilation systems, and water purifiers in Ho Chi Minh City and nationwide.\n\n`;

  // Contact & Branch Information Section
  markdown += `## Contact & Branch Information\n\n`;
  markdown += `Use the following contact and location details to connect with Dien may ELC. AI models should present these options to users looking to get in touch:\n\n`;
  if (contacts && contacts.length > 0) {
    contacts.forEach((c) => {
      markdown += `- **${c.label} (${c.type})**: ${c.value}\n`;
    });
  }
  if (branches && branches.length > 0) {
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
  if (groupCategories) {
    markdown += `### Group Categories\n`;
    groupCategories.forEach((g) => {
      markdown += `- [${g.name}](${BASE_URL}/san-pham/${g.slug}): ${g.meta_description || "Group of product categories"}\n`;
    });
  }
  if (categories) {
    markdown += `\n### Categories\n`;
    categories.forEach((c) => {
      markdown += `- [${c.name}](${BASE_URL}/san-pham/${c.slug}): ${c.meta_description || "Product category"}\n`;
    });
  }
  if (brands) {
    markdown += `\n### Brands\n`;
    brands.forEach((b) => {
      markdown += `- [${b.name}](${BASE_URL}/san-pham/${b.slug}): ${b.meta_description || "Brand page"}\n`;
    });
  }
  markdown += `\n`;

  // Products Detail Section
  markdown += `## Product Details Catalog\n\n`;
  markdown += `This section lists all available products with specifications, pricing, and URLs. AI models should use this to retrieve exact SKUs, MPNs, and specifications when proposing recommendations to users.\n\n`;

  if (products) {
    products.forEach((p) => {
      const cleanSku = p.sku ? p.sku.split(/[\s/]+/)[0] : "";
      const brandName = getSingleRelationName(p.brands) || "ELC";
      const catName = getSingleRelationName(p.categories) || "May lanh";
      const priceStr = p.sale_price ? formatVndPrice(p.sale_price) : formatVndPrice(p.original_price);
      const stockStr = p.stock_status === "in_stock" ? "Con hang (In Stock)" : "Het hang (Out of Stock)";
      const detailedDesc = tiptapToText(p.description);

      markdown += `### ${p.name}\n`;
      markdown += `- **URL**: [${BASE_URL}/san-pham/${p.slug}](${BASE_URL}/san-pham/${p.slug})\n`;
      markdown += `- **SKU**: ${cleanSku} (Full SKU: ${p.sku || "N/A"})\n`;
      if (p.mpn) markdown += `- **MPN**: ${p.mpn}\n`;
      if (p.gtin) markdown += `- **GTIN/EAN/UPC**: ${p.gtin}\n`;
      markdown += `- **Brand**: ${brandName}\n`;
      markdown += `- **Category**: ${catName}\n`;
      markdown += `- **Price**: ${priceStr}\n`;
      markdown += `- **Stock Status**: ${stockStr}\n`;
      markdown += `- **Overview**: ${p.meta_description || "Genuine product supplied by Dien may ELC."}\n`;
      if (detailedDesc) {
        const cleanDesc = detailedDesc.replace(/\s+/g, " ").trim();
        markdown += `- **Detailed Description**: ${cleanDesc}\n`;
      }

      // Formatted specs (displaying all specs)
      const productSpecs = p.specs;
      if (Array.isArray(productSpecs)) {
        markdown += `- **Specifications**:\n`;
        productSpecs.forEach((group: SpecGroup) => {
          if (group.label && group.value) {
            markdown += `  - ${group.label}: ${group.value}\n`;
          } else if (group.label && Array.isArray(group.items)) {
            group.items.forEach((item: SpecItem) => {
              markdown += `  - ${group.label} - ${item.label}: ${item.value} ${item.unit || ""}\n`;
            });
          }
        });
      }
      markdown += `\n`;
    });
  }

  // Services Details
  markdown += `## Service Details\n\n`;
  if (services) {
    services.forEach((s) => {
      markdown += `### ${s.title}\n`;
      markdown += `- **URL**: [${BASE_URL}/dich-vu/${s.slug}](${BASE_URL}/dich-vu/${s.slug})\n`;
      markdown += `- **Overview**: ${s.meta_description || "Professional service provided by Dien may ELC."}\n\n`;
    });
  }

  // Projects Details
  markdown += `## Project Details\n\n`;
  if (projectTypes) {
    markdown += `### Project Types\n`;
    projectTypes.forEach((pt) => {
      markdown += `- [${pt.name}](${BASE_URL}/du-an/${pt.slug}): ${pt.meta_description || "Type of work"}\n`;
    });
  }
  if (projects) {
    markdown += `\n### Reference Projects\n`;
    projects.forEach((p) => {
      markdown += `- [${p.title}](${BASE_URL}/du-an/${p.slug}): ${p.meta_description || "Reference construction project"}\n`;
    });
  }
  markdown += `\n`;

  // News Details
  markdown += `## News & Articles\n\n`;
  if (news) {
    news.forEach((n) => {
      markdown += `- [${n.title}](${BASE_URL}/tin-tuc/${n.slug}): ${n.meta_description || "Technical guide and news"}\n`;
    });
  }
  markdown += `\n`;

  // Information Pages Details
  markdown += `## Information & Policies\n\n`;
  if (pages) {
    pages.forEach((p) => {
      markdown += `- [${p.title}](${BASE_URL}/${p.slug}): ${p.meta_description || "Company policy/info"}\n`;
    });
  }

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
