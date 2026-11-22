import { describe, expect, it } from "vitest";
import type { ProductWithRelations } from "@/modules/catalog/domain/types";
import {
  buildProductListMarkdown,
  buildProductMarkdown,
  buildProductNotFoundMarkdown,
  buildProductsIndexMarkdown,
  formatPriceRange,
  PRODUCT_LIST_CAP,
} from "@/shared/lib/agent-markdown/render-products";
import { BASE_URL } from "@/shared/lib/seo-schema";

const doc = (t: string) => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: t }] }] });

const product = {
  id: "p1",
  name: "Daikin FTKB25",
  slug: "daikin-ftkb25",
  description: doc("Máy lạnh tiết kiệm điện"),
  images: [{ url: "/img/a.jpg", alt: "Mặt trước" }],
  status: "published",
  highlights: ["Inverter", "  "],
  displayPrice: 9342593,
  priceMin: 9342593,
  priceMax: 10000000,
  displayStockStatus: "in_stock",
  updatedAt: "2026-01-02T00:00:00Z",
  brand: { name: "Daikin", slug: "daikin" },
  category: { id: "c", name: "Máy lạnh", slug: "may-lanh" },
  options: [{ id: "o1", name: "Màu", orderIndex: 0, values: [{ id: "v1", value: "Trắng", orderIndex: 0 }] }],
  variants: [
    { id: "x", mpn: "FTKB25", sku: "S", isDefault: true, isActive: true, stockStatus: "in_stock", displayPrice: 9342593, optionValueIds: ["v1"] },
  ],
  attributeValues: [{ name: "Công suất", valueNumber: 1, unit: "HP", groupLabel: "Chung" }],
} as unknown as ProductWithRelations;

describe("formatPriceRange", () => {
  it("single and range", () => {
    expect(formatPriceRange({ displayPrice: 1000, priceMin: 1000, priceMax: 1000 })).toContain("1.000");
    expect(formatPriceRange({ displayPrice: 1000, priceMin: 1000, priceMax: 2000 })).toMatch(/ - /);
    expect(formatPriceRange({})).toBeNull();
  });
});

describe("buildProductMarkdown", () => {
  const md = buildProductMarkdown(product);
  it("renders core sections", () => {
    expect(md).toContain(`canonical: ${BASE_URL}/san-pham/daikin-ftkb25`);
    expect(md).toContain("# Daikin FTKB25");
    expect(md).toContain("Còn hàng");
    expect(md).toContain("- Inverter");
    expect(md).toContain("Máy lạnh tiết kiệm điện");
    expect(md).toContain("Màu: Trắng");
    expect(md).toContain("**Công suất**: 1 HP");
    expect(md).toContain(`![Mặt trước](${BASE_URL}/img/a.jpg)`);
    expect(md).toContain("Yêu cầu báo giá");
  });
  it("survives empty highlights object and missing description", () => {
    const p = { ...product, highlights: {} as unknown as string[], description: null } as unknown as ProductWithRelations;
    expect(() => buildProductMarkdown(p)).not.toThrow();
  });
});

describe("buildProductMarkdown extras", () => {
  it("renders FAQ, reviews and related", () => {
    const md = buildProductMarkdown(product, {
      faqs: [{ question: "Q1?", answer: "A1" }],
      aggregate: { average: 4.5, count: 2 },
      reviews: [
        { id: "1", rating: 4, comment: "ok", reviewerName: "An", createdAt: "2026-01-01T00:00:00Z" },
        { id: "2", rating: 5, comment: "tot", reviewerName: "Binh", createdAt: "2026-02-01T00:00:00Z" },
      ],
      related: [{ name: "R1", slug: "r1", displayPrice: 5000 }],
    });
    expect(md).toContain("## Câu hỏi thường gặp");
    expect(md).toContain("### Q1?");
    expect(md).toContain("4.5/5 (2 đánh giá)");
    expect(md.indexOf("Binh")).toBeLessThan(md.indexOf("An"));
    expect(md).toContain(`[R1](${BASE_URL}/san-pham/r1) - 5.000 VND`);
  });
  it("omits sections when empty", () => {
    const md = buildProductMarkdown(product, { faqs: [], aggregate: { average: 0, count: 0 }, reviews: [], related: [] });
    expect(md).not.toMatch(/## (Câu hỏi|Đánh giá|Sản phẩm liên quan)/);
  });
});

describe("buildProductListMarkdown", () => {
  const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `P${i}`, slug: `p${i}`, displayPrice: 1000 }));
  const entity = { type: "brand" as const, name: "Daikin", slug: "daikin", content: doc("x") };
  it("lists all products below the ceiling, no showing-line", () => {
    const md = buildProductListMarkdown({ entity, products: mk(60), totalCount: 60 });
    expect((md.match(/^- \[P/gm) ?? []).length).toBe(60);
    expect(md).not.toContain("Đang hiển thị");
    expect(md).toContain(`${BASE_URL}/san-pham/p0`);
  });
  it("caps at the safety ceiling and says so", () => {
    const md = buildProductListMarkdown({ entity, products: mk(PRODUCT_LIST_CAP + 5), totalCount: PRODUCT_LIST_CAP + 5 });
    expect((md.match(/^- \[P/gm) ?? []).length).toBe(PRODUCT_LIST_CAP);
    expect(md).toContain(`Đang hiển thị ${PRODUCT_LIST_CAP} trên tổng ${PRODUCT_LIST_CAP + 5}`);
  });
  it("handles empty", () => {
    expect(buildProductListMarkdown({ entity: { type: "category", name: "A", slug: "a" }, products: [], totalCount: 0 })).toContain("chưa có sản phẩm");
  });
});

describe("index and 404", () => {
  it("links categories and brands", () => {
    const md = buildProductsIndexMarkdown({ categories: [{ name: "C", slug: "c" }], brands: [{ name: "B", slug: "b" }] });
    expect(md).toContain(`[C](${BASE_URL}/san-pham/c)`);
    expect(md).toContain(`[B](${BASE_URL}/san-pham/b)`);
  });
  it("renders category sections with preview products", () => {
    const md = buildProductsIndexMarkdown({
      categories: [],
      brands: [],
      sections: [
        {
          name: "Máy lạnh treo tường",
          slug: "treo-tuong",
          groupName: "Máy lạnh",
          groupSlug: "may-lanh",
          totalCount: 7,
          products: [{ name: "P1", slug: "p1", displayPrice: 1000000, compareAtPrice: 1200000 }],
        },
      ],
    });
    expect(md).toContain(`## [Máy lạnh](${BASE_URL}/san-pham/may-lanh)`);
    expect(md).toContain("### Máy lạnh treo tường");
    expect(md).toContain(`[Xem tất cả 7 sản phẩm](${BASE_URL}/san-pham/treo-tuong)`);
    expect(md).toContain(`- [P1](${BASE_URL}/san-pham/p1): 1.000.000 VND (giá gốc 1.200.000 VND)`);
    expect(md).toContain("Hiển thị thêm 6 sản phẩm");
  });
  it("description heading", () => expect(buildProductMarkdown(product)).toContain("## Mô tả sản phẩm"));
  it("404 body",() => expect(buildProductNotFoundMarkdown()).toMatch(/^# 404/));
});

describe("FAQ on list pages and services block on product", () => {
  const entity = { type: "category" as const, name: "Máy lạnh", slug: "may-lanh" };
  it("renders list FAQ only when present", () => {
    const withFaq = buildProductListMarkdown({
      entity,
      products: [],
      totalCount: 0,
      faqs: [{ question: "Chọn công suất?", answer: "Theo diện tích" }],
    });
    expect(withFaq).toContain("## Câu hỏi thường gặp");
    expect(withFaq).toContain("### Chọn công suất?");
    expect(buildProductListMarkdown({ entity, products: [], totalCount: 0 })).not.toContain("Câu hỏi thường gặp");
  });
  it("renders services with absolute links", () => {
    const md = buildProductMarkdown(product, { services: [{ title: "Lắp máy lạnh", slug: "lap-may-lanh", description: "Khảo sát" }] });
    expect(md).toContain("## Lắp đặt và dịch vụ đi kèm");
    expect(md).toContain(`[Lắp máy lạnh](${BASE_URL}/dich-vu/lap-may-lanh) - Khảo sát`);
    expect(buildProductMarkdown(product)).not.toContain("Lắp đặt và dịch vụ");
  });
});
