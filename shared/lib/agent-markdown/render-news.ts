import { buildFrontmatter, buildInquirySection } from "@/shared/lib/agent-markdown/render";
import { richTextToMarkdown } from "@/shared/lib/agent-markdown/richtext-to-markdown";
import type { FAQ } from "@/modules/faq/domain/types";
import { formatPriceRange } from "@/shared/lib/agent-markdown/render-products";
import { BASE_URL } from "@/shared/lib/seo-schema";

// Hard safety ceiling only: every published post is listed up to this many.
export const NEWS_INDEX_LIMIT = 500;

export interface NewsMarkdownItem {
  title: string;
  slug: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  excerpt?: string | null;
}

export interface NewsDetailInput extends NewsMarkdownItem {
  content: unknown;
  metaDescription?: string | null;
  categoryName?: string | null;
}

export interface NewsDetailExtras {
  faqs?: Pick<FAQ, "question" | "answer">[];
  relatedProducts?: { name: string; slug: string; displayPrice?: number | null; priceMin?: number | null; priceMax?: number | null }[];
  relatedProductsEntity?: { slug: string } | null;
  relatedProductsTotal?: number;
  relatedNews?: NewsMarkdownItem[];
}

function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function dateOnly(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function buildNewsIndexMarkdown(items: NewsMarkdownItem[], total = items.length): string {
  const shown = items.slice(0, NEWS_INDEX_LIMIT);
  const description =
    "Cập nhật kiến thức kỹ thuật, hướng dẫn sử dụng và bảo trì máy lạnh, điều hòa, hệ thống khí tươi từ đội ngũ kỹ sư Điện máy ELC.";
  const out: string[] = [
    buildFrontmatter({
      title: "Tin tức & kiến thức điện lạnh | Điện máy ELC",
      description,
      canonicalUrl: `${BASE_URL}/tin-tuc`,
    }),
    "# Tin tức",
    "",
    `> ${description}`,
    "",
  ];
  if (shown.length === 0) {
    out.push("Hiện tại chưa có tin tức nào được đăng tải.", "");
  } else {
    for (const n of shown) {
      const date = dateOnly(n.createdAt);
      const ex = n.excerpt ? oneLine(n.excerpt) : "";
      out.push(
        `- [${oneLine(n.title)}](${BASE_URL}/tin-tuc/${n.slug})${date ? ` (${date})` : ""}${ex ? `: ${ex}` : ""}`,
      );
    }
    out.push("");
    if (total > shown.length) {
      out.push(
        `Hiển thị ${shown.length} bài mới nhất trên tổng số ${total} bài. Xem đầy đủ tại [trang tin tức](${BASE_URL}/tin-tuc) hoặc [sitemap](${BASE_URL}/sitemap.xml).`,
        "",
      );
    }
  }
  out.push(buildInquirySection());
  return out.join("\n");
}

export function buildNewsDetailMarkdown(n: NewsDetailInput, extras: NewsDetailExtras = {}): string {
  const url = `${BASE_URL}/tin-tuc/${n.slug}`;
  const summary = n.excerpt ? oneLine(n.excerpt) : n.metaDescription ? oneLine(n.metaDescription) : "";
  const created = dateOnly(n.createdAt);
  const updated = dateOnly(n.updatedAt);
  const out: string[] = [
    buildFrontmatter({
      title: oneLine(n.title),
      description: summary || oneLine(n.title),
      canonicalUrl: url,
      updatedAt: n.updatedAt || undefined,
    }),
    `# ${oneLine(n.title)}`,
    "",
  ];
  const meta: string[] = [];
  if (created) meta.push(`Đăng ngày: ${created}`);
  if (updated && updated !== created) meta.push(`Cập nhật: ${updated}`);
  if (n.categoryName) meta.push(`Chuyên mục: ${n.categoryName}`);
  if (meta.length) out.push(meta.join(" · "), "");
  if (summary) out.push(`> ${summary}`, "");
  const body = richTextToMarkdown(n.content, { baseUrl: BASE_URL });
  if (body) out.push(body, "");
  const faqs = (extras.faqs ?? []).filter((f) => f.question?.trim() && f.answer?.trim());
  if (faqs.length > 0) {
    out.push("## Câu hỏi thường gặp", "");
    for (const f of faqs) {
      const a = richTextToMarkdown(f.answer, { baseUrl: BASE_URL }) || oneLine(f.answer);
      out.push(`### ${oneLine(f.question)}`, "", a, "");
    }
  }
  const products = extras.relatedProducts ?? [];
  if (products.length > 0) {
    out.push("## Sản phẩm liên quan", "");
    for (const p of products) {
      const price = formatPriceRange(p);
      out.push(`- [${oneLine(p.name)}](${BASE_URL}/san-pham/${p.slug})${price ? `: ${price}` : ""}`);
    }
    const total = extras.relatedProductsTotal ?? 0;
    if (extras.relatedProductsEntity && total > products.length) {
      out.push(`- [Xem tất cả ${total} sản phẩm](${BASE_URL}/san-pham/${extras.relatedProductsEntity.slug})`);
    }
    out.push("");
  }
  const relNews = extras.relatedNews ?? [];
  if (relNews.length > 0) {
    out.push("## Bài viết liên quan", "");
    for (const r of relNews) {
      const d = dateOnly(r.createdAt);
      out.push(`- [${oneLine(r.title)}](${BASE_URL}/tin-tuc/${r.slug})${d ? ` (${d})` : ""}`);
    }
    out.push("");
  }
  out.push(`Bản HTML: [${url}](${url}) · [Tất cả tin tức](${BASE_URL}/tin-tuc)`, "", buildInquirySection());
  return out.join("\n");
}

export function buildNewsNotFoundMarkdown(): string {
  return [
    "# 404 Không tìm thấy bài viết",
    "",
    "Bài viết này không tồn tại hoặc đã bị gỡ.",
    "",
    `- [Danh sách tin tức](${BASE_URL}/tin-tuc)`,
    `- [Sitemap](${BASE_URL}/sitemap.xml)`,
    "",
  ].join("\n");
}
