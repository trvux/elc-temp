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

describe("buildProductListMarkdown", () => {
  const items = Array.from({ length: 60 }, (_, i) => ({ name: `P${i}`, slug: `p${i}`, displayPrice: 1000 }));
  it("caps and says so", () => {
    const md = buildProductListMarkdown({ entity: { type: "brand", name: "Daikin", slug: "daikin", content: doc("x") }, products: items, totalCount: 60 });
    expect((md.match(/^- \[P/gm) ?? []).length).toBe(PRODUCT_LIST_CAP);
    expect(md).toContain("Đang hiển thị 50 trên tổng 60");
    expect(md).toContain(`${BASE_URL}/san-pham/p0`);
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
  it("404 body", () => expect(buildProductNotFoundMarkdown()).toMatch(/^# 404/));
});
