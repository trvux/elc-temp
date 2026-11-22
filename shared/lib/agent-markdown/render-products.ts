import type { ProductWithRelations } from "@/modules/catalog/domain/types";
import { STOCK_STATUS_MAP, VARIANT_STOCK_STATUS_MAP } from "@/modules/catalog/domain/constants";
import { excerptFromRichText } from "@/shared/lib/rich-text";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { buildFrontmatter, buildInquirySection } from "./render";
import type { FAQ } from "@/modules/faq/domain/types";
import type { Review, ReviewAggregate } from "@/modules/review/domain/types";
import { richTextToMarkdown } from "./richtext-to-markdown";

// Pure Markdown builders for /san-pham and /san-pham/<slug>. No I/O: the route
// handlers under app/agent-md/san-pham fetch and pass plain data in.

// Hard safety ceiling for the Markdown list (all published products are listed below it).
export const PRODUCT_LIST_CAP = 500;
const LIST_CONTENT_MAX_CHARS = 3000;

export const SAN_PHAM_URL = `${BASE_URL}/san-pham`;
const productUrl = (slug: string) => `${SAN_PHAM_URL}/${slug}`;

const vnd = new Intl.NumberFormat("vi-VN");
export function formatVnd(n: number): string {
  return `${vnd.format(n)} VND`;
}

// Single price, or "min - max" when the variants span a range.
export function formatPriceRange(p: {
  displayPrice?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
}): string | null {
  const { priceMin: min, priceMax: max, displayPrice: d } = p;
  if (min != null && max != null && min > 0 && min !== max) {
    return `${formatVnd(min)} - ${formatVnd(max)}`;
  }
  const single = d ?? min ?? max;
  return single != null && single > 0 ? formatVnd(single) : null;
}

const absUrl = (u: string) => (u.startsWith("http") ? u : u.startsWith("//") ? `https:${u}` : `${BASE_URL}${u.startsWith("/") ? "" : "/"}${u}`);
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

function attributeValueText(av: NonNullable<ProductWithRelations["attributeValues"]>[number]): string {
  if (av.valueText) return av.valueText;
  if (av.valueNumber != null) return `${av.valueNumber}${av.unit ? ` ${av.unit}` : ""}`;
  if (av.valueBoolean != null) return av.valueBoolean ? "Có" : "Không";
  if (av.valueOptions && av.valueOptions.length > 0) return av.valueOptions.join(", ");
  return "";
}

export interface ProductExtras {
  faqs?: Pick<FAQ, "question" | "answer">[];
  reviews?: Review[];
  aggregate?: ReviewAggregate | null;
  related?: ProductListItem[];
}

const REVIEW_MAX = 10;
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export function buildProductMarkdown(product: ProductWithRelations, extras: ProductExtras = {}): string {
  const url = productUrl(product.slug);
  const description =
    product.metaDescription || excerptFromRichText(product.description) || `${product.name} chính hãng tại Điện máy ELC`;
  const out: string[] = [
    buildFrontmatter({
      title: product.metaTitle || product.name,
      description,
      canonicalUrl: url,
      updatedAt: product.updatedAt,
    }),
    `# ${product.name}`,
    "",
  ];

  const facts: string[] = [];
  if (product.brand) facts.push(`- **Thương hiệu**: [${product.brand.name}](${productUrl(product.brand.slug)})`);
  if (product.category) facts.push(`- **Danh mục**: [${product.category.name}](${productUrl(product.category.slug)})`);
  const price = formatPriceRange(product);
  if (price) facts.push(`- **Giá**: ${price}`);
  if (product.displayStockStatus) {
    facts.push(`- **Tình trạng**: ${STOCK_STATUS_MAP[product.displayStockStatus] ?? product.displayStockStatus}`);
  }
  const defaultVariant = (product.variants ?? []).find((v) => v.isDefault) ?? product.variants?.[0];
  if (defaultVariant?.mpn) facts.push(`- **Mã model (MPN)**: ${defaultVariant.mpn}`);
  facts.push(`- **Trang web**: ${url}`);
  out.push(...facts, "");

  const highlights = (Array.isArray(product.highlights) ? product.highlights : []).filter(
    (h) => typeof h === "string" && h.trim(),
  );
  if (highlights.length > 0) {
    out.push("## Đặc điểm nổi bật", "", ...highlights.map((h) => `- ${h.trim()}`), "");
  }

  const rows = (product.attributeValues ?? []).filter((av) => attributeValueText(av));
  if (rows.length > 0) {
    out.push("## Thông số kỹ thuật", "");
    let currentGroup: string | null | undefined;
    for (const av of rows) {
      const g = av.groupLabel || null;
      if (g !== currentGroup && g) out.push("", `### ${g}`, "");
      currentGroup = g;
      out.push(`- **${av.name}**: ${attributeValueText(av)}`);
    }
    out.push("");
  }

  const descMd = richTextToMarkdown(product.description, { baseUrl: BASE_URL });
  if (descMd) out.push("## Mô tả", "", descMd, "");

  const variants = (product.variants ?? []).filter((v) => v.isActive);
  if (variants.length > 0) {
    const valueLabel = new Map<string, string>();
    for (const opt of product.options ?? []) for (const v of opt.values) valueLabel.set(v.id, `${opt.name}: ${v.value}`);
    out.push("## Phiên bản", "", "| MPN | Tùy chọn | Giá | Tình trạng |", "| --- | --- | --- | --- |");
    for (const v of variants) {
      const opts = v.optionValueIds.map((id) => valueLabel.get(id)).filter(Boolean).join("; ");
      const vp = v.displayPrice > 0 ? formatVnd(v.displayPrice) : "";
      out.push(
        `| ${cell(v.mpn || v.sku)} | ${cell(opts)} | ${vp} | ${VARIANT_STOCK_STATUS_MAP[v.stockStatus] ?? v.stockStatus} |`,
      );
    }
    out.push("");
  }

  const images = product.images ?? [];
  if (images.length > 0) {
    out.push("## Hình ảnh", "");
    for (const img of images) out.push(`![${(img.alt || product.name).replace(/[\[\]]/g, "")}](${absUrl(img.url)})`);
    out.push("");
  }

  const faqs = (extras.faqs ?? []).filter((f) => f.question?.trim() && f.answer?.trim());
  if (faqs.length > 0) {
    out.push("## Câu hỏi thường gặp", "");
    for (const f of faqs) {
      const a = richTextToMarkdown(f.answer, { baseUrl: BASE_URL }) || oneLine(f.answer);
      out.push(`### ${oneLine(f.question)}`, "", a, "");
    }
  }

  const agg = extras.aggregate;
  if (agg && agg.count > 0) {
    out.push("## Đánh giá", "", `- **Điểm trung bình**: ${agg.average}/5 (${agg.count} đánh giá)`, "");
    const recent = [...(extras.reviews ?? [])]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, REVIEW_MAX);
    for (const r of recent) {
      const d = Number.isNaN(Date.parse(r.createdAt)) ? "" : ` (${r.createdAt.slice(0, 10)})`;
      const text = oneLine(r.comment ?? "");
      out.push(`- **${oneLine(r.reviewerName || "Khách hàng")}** - ${r.rating}/5${d}${text ? `: ${text}` : ""}`);
    }
    if (recent.length > 0) out.push("");
  }

  const siblings = (product.capacitySiblings ?? []).filter((c) => !c.isCurrent);
  const relatedSlugs = new Set((extras.related ?? []).map((r) => r.slug));
  const siblingOnly = siblings.filter((c) => !relatedSlugs.has(c.slug));
  if ((extras.related ?? []).length > 0 || siblingOnly.length > 0) {
    out.push("## Sản phẩm liên quan", "");
    for (const r of extras.related ?? []) {
      const rp = formatPriceRange(r);
      out.push(`- [${r.name}](${productUrl(r.slug)})${rp ? ` - ${rp}` : ""}`);
    }
    for (const c of siblingOnly) out.push(`- [${c.name}](${productUrl(c.slug)})${c.capacityLabel ? ` - ${c.capacityLabel}` : ""}`);
    out.push("");
  }

  out.push(buildInquirySection());
  return out.join("\n");
}

export interface ProductListEntity {
  type: "group" | "category" | "brand" | "hp_page";
  name: string;
  slug: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  content?: unknown;
  updatedAt?: string | null;
  /** Hidden categories/groups stay reachable but are not promoted. */
  isHidden?: boolean;
}

export interface ProductListItem {
  name: string;
  slug: string;
  displayPrice?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
}

export interface ChildLink {
  name: string;
  slug: string;
}

export function buildProductListMarkdown(input: {
  entity: ProductListEntity;
  products: ProductListItem[];
  totalCount: number;
  childCategories?: ChildLink[];
}): string {
  const { entity, products, totalCount } = input;
  const url = productUrl(entity.slug);
  const body = richTextToMarkdown(entity.content, { baseUrl: BASE_URL, maxChars: LIST_CONTENT_MAX_CHARS });
  const description =
    entity.metaDescription || excerptFromRichText(entity.content) || `${entity.name} chính hãng tại Điện máy ELC`;
  const out: string[] = [
    buildFrontmatter({ title: entity.metaTitle || entity.name, description, canonicalUrl: url, updatedAt: entity.updatedAt }),
    `# ${entity.name}`,
    "",
    `Trang web: ${url}`,
    "",
  ];
  if (entity.imageUrl) out.push(`![${entity.name.replace(/[\[\]]/g, "")}](${absUrl(entity.imageUrl)})`, "");
  if (body) out.push(body, "");

  if (input.childCategories && input.childCategories.length > 0) {
    out.push("## Danh mục con", "", ...input.childCategories.map((c) => `- [${c.name}](${productUrl(c.slug)})`), "");
  }

  out.push("## Sản phẩm", "");
  if (products.length === 0) {
    out.push("Hiện chưa có sản phẩm nào trong mục này.", "");
  } else {
    const capped = products.slice(0, PRODUCT_LIST_CAP);
    for (const p of capped) {
      const price = formatPriceRange(p);
      out.push(`- [${p.name}](${productUrl(p.slug)})${price ? ` - ${price}` : ""}`);
    }
    out.push("");
    const shown = capped.length;
    if (totalCount > shown && shown >= PRODUCT_LIST_CAP) {
      out.push(`Đang hiển thị ${shown} trên tổng ${totalCount} sản phẩm. Xem đầy đủ tại [trang web](${url}).`, "");
    }
  }
  out.push(buildInquirySection());
  return out.join("\n");
}

export function buildProductsIndexMarkdown(input: {
  categories: ChildLink[];
  brands: ChildLink[];
  content?: unknown;
  metaDescription?: string | null;
  updatedAt?: string | null;
}): string {
  const body = richTextToMarkdown(input.content, { baseUrl: BASE_URL, maxChars: LIST_CONTENT_MAX_CHARS });
  const out: string[] = [
    buildFrontmatter({
      title: "Sản phẩm điện lạnh chính hãng",
      description:
        input.metaDescription ||
        excerptFromRichText(input.content) ||
        "Danh mục sản phẩm điện lạnh chính hãng tại Điện máy ELC: máy lạnh, cấp khí tươi, máy lọc nước.",
      canonicalUrl: SAN_PHAM_URL,
      updatedAt: input.updatedAt,
    }),
    "# Sản phẩm",
    "",
    `Trang web: ${SAN_PHAM_URL}`,
    "",
  ];
  if (body) out.push(body, "");
  out.push("## Danh mục sản phẩm", "");
  for (const c of input.categories) out.push(`- [${c.name}](${productUrl(c.slug)})`);
  out.push("");
  if (input.brands.length > 0) {
    out.push("## Thương hiệu", "");
    for (const b of input.brands) out.push(`- [${b.name}](${productUrl(b.slug)})`);
    out.push("");
  }
  out.push(buildInquirySection());
  return out.join("\n");
}

export function buildProductNotFoundMarkdown(): string {
  return [
    "# 404 - Không tìm thấy sản phẩm",
    "",
    "Sản phẩm hoặc danh mục bạn yêu cầu không tồn tại hoặc đã ngừng bán.",
    "",
    `- [Danh mục sản phẩm](${SAN_PHAM_URL})`,
    `- [llms.txt](${BASE_URL}/llms.txt)`,
    `- [Sitemap](${BASE_URL}/sitemap.xml)`,
    "",
  ].join("\n");
}
