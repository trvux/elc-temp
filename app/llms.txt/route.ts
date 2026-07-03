import { NextResponse } from "next/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { cacheLife } from "next/cache";

const BASE_URL = "https://dienmayelc.com.vn";

async function getLlmMarkdown() {
  "use cache";
  cacheLife("hours");
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
    .select("slug, name")
    .is("deleted_at", null);

  // Fetch Brands
  const { data: brands } = await supabase
    .from("brands")
    .select("slug, name")
    .is("deleted_at", null);

  // Fetch Group Categories
  const { data: groupCategories } = await supabase
    .from("group_categories")
    .select("slug, name")
    .is("deleted_at", null);

  // Fetch Products
  const { data: products } = await supabase
    .from("products")
    .select("slug, name, sku, mpn")
    .eq("is_published", true)
    .is("deleted_at", null);

  // Fetch Services
  const { data: services } = await supabase
    .from("services")
    .select("slug, title")
    .eq("is_published", true)
    .is("deleted_at", null);

  // Fetch Pages
  const { data: pages } = await supabase
    .from("pages")
    .select("slug, title")
    .eq("is_published", true)
    .is("deleted_at", null);

  // Fetch Projects
  const { data: projects } = await supabase
    .from("projects")
    .select("slug, title")
    .eq("is_published", true)
    .is("deleted_at", null);

  // Fetch Project Types
  const { data: projectTypes } = await supabase
    .from("project_type")
    .select("slug, name")
    .is("deleted_at", null);

  // Fetch News
  const { data: news } = await supabase
    .from("news")
    .select("slug, title")
    .eq("is_published", true)
    .is("deleted_at", null);

  let markdown = `# Dien may ELC - Sitemap for LLMs & AI Search Bot\n\n`;
  markdown += `Dien may ELC (Cong ty Co phan Giai phap Cong nghe TMDV ELC) specializes in supplying and installing genuine air conditioning systems, VRV/VRF central air conditioning, fresh air ventilation systems, and water purifiers in Ho Chi Minh City and nationwide.\n\n`;
  markdown += `For a comprehensive directory including detailed product specifications, pricing, stock statuses, and descriptions, see the [Full Specification](${BASE_URL}/llms-full.txt).\n\n`;

  // Contact Information Section
  markdown += `## Contact & Branch Information\n\n`;
  markdown += `Use the following contact and location details to connect with Dien may ELC:\n\n`;
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

  markdown += `## Core Sections\n\n`;
  markdown += `- [Homepage](${BASE_URL}): Official website of Dien may ELC.\n`;
  markdown += `- [Products](${BASE_URL}/san-pham): All products catalog.\n`;
  markdown += `- [Services](${BASE_URL}/dich-vu): Professional installation, maintenance, and repair services.\n`;
  markdown += `- [Projects](${BASE_URL}/du-an): Portfolio of ELC air conditioning & HVAC projects.\n`;
  markdown += `- [News](${BASE_URL}/tin-tuc): Technical guides and news.\n`;
  markdown += `- [About Us](${BASE_URL}/gioi-thieu-ve-dien-may-elc): Contact and company overview.\n\n`;

  // Categories, Groups, and Brands
  markdown += `## Product Categories & Brands\n\n`;
  if (groupCategories) {
    groupCategories.forEach((g) => {
      markdown += `- [Group: ${g.name}](${BASE_URL}/san-pham/${g.slug})\n`;
    });
  }
  if (categories) {
    categories.forEach((c) => {
      markdown += `- [Category: ${c.name}](${BASE_URL}/san-pham/${c.slug})\n`;
    });
  }
  if (brands) {
    brands.forEach((b) => {
      markdown += `- [Brand: ${b.name}](${BASE_URL}/san-pham/${b.slug})\n`;
    });
  }
  markdown += `\n`;

  // Products
  markdown += `## Products (Flat URLs)\n\n`;
  if (products) {
    products.forEach((p) => {
      const cleanSku = p.sku ? p.sku.split(/[\s/]+/)[0] : "";
      const mpnStr = p.mpn ? ` | MPN: ${p.mpn}` : "";
      markdown += `- [${p.name} - SKU: ${cleanSku}${mpnStr}](${BASE_URL}/san-pham/${p.slug})\n`;
    });
  }
  markdown += `\n`;

  // Services
  markdown += `## Services\n\n`;
  if (services) {
    services.forEach((s) => {
      markdown += `- [Service: ${s.title}](${BASE_URL}/dich-vu/${s.slug})\n`;
    });
  }
  markdown += `\n`;

  // Projects
  markdown += `## Projects & Project Types\n\n`;
  if (projectTypes) {
    projectTypes.forEach((pt) => {
      markdown += `- [Project Type: ${pt.name}](${BASE_URL}/du-an/${pt.slug})\n`;
    });
  }
  if (projects) {
    projects.forEach((p) => {
      markdown += `- [Project: ${p.title}](${BASE_URL}/du-an/${p.slug})\n`;
    });
  }
  markdown += `\n`;

  // News
  markdown += `## News & Articles\n\n`;
  if (news) {
    news.forEach((n) => {
      markdown += `- [News: ${n.title}](${BASE_URL}/tin-tuc/${n.slug})\n`;
    });
  }
  markdown += `\n`;

  // Pages
  markdown += `## Information & Pages\n\n`;
  if (pages) {
    pages.forEach((p) => {
      markdown += `- [Info: ${p.title}](${BASE_URL}/${p.slug})\n`;
    });
  }

  return markdown;
}

export async function GET() {
  const markdown = await getLlmMarkdown();
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
