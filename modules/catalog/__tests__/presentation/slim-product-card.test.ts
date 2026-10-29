import { describe, expect, it } from "vitest";
import type { ProductWithRelations } from "@/modules/catalog/domain";
import { slimProductForCard } from "@/modules/catalog/presentation/lib/slim-product-card";

const big = { type: "doc", content: "x".repeat(5000) };

const product = {
  id: "p1",
  name: "Daikin FTKB25",
  slug: "daikin-ftkb25",
  description: big,
  metaTitle: "t",
  metaDescription: "d",
  images: [{ url: "https://img/1.webp" }],
  displayStockStatus: "in_stock",
  variants: [{ id: "v1", sku: "SKU1" }],
  tags: [{ id: "t1", name: "Hot", slug: "hot" }],
  brand: { id: "b1", name: "Daikin", slug: "daikin", content: big, warrantyPolicy: "long", logoUrl: "" },
  category: { id: "c1", name: "Máy lạnh", slug: "may-lanh", metaTitle: "m", metaDescription: "n" },
} as unknown as ProductWithRelations;

describe("slimProductForCard", () => {
  it("drops long-form fields but keeps everything ProductCard renders", () => {
    const slim = slimProductForCard(product);
    expect(slim.description).toBeNull();
    expect(slim.metaDescription).toBeUndefined();
    expect(slim.brand?.content).toBeUndefined();
    expect(slim.brand?.name).toBe("Daikin");
    expect(slim.category).toEqual({ id: "c1", name: "Máy lạnh", slug: "may-lanh" });
    expect(slim.name).toBe(product.name);
    expect(slim.images).toEqual(product.images);
    expect(slim.variants).toEqual(product.variants);
    expect(slim.tags).toEqual(product.tags);
  });

  it("shrinks the serialized payload", () => {
    expect(JSON.stringify(slimProductForCard(product)).length).toBeLessThan(
      JSON.stringify(product).length / 5,
    );
  });

  it("does not mutate the input", () => {
    slimProductForCard(product);
    expect(product.description).toBe(big);
  });
});
