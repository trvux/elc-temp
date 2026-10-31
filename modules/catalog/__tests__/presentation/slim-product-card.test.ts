import { describe, expect, it } from "vitest";
import type { ProductWithRelations } from "@/modules/catalog/domain";
import { slimProductForCard } from "@/modules/catalog/presentation/lib/slim-product-card";

const big = { type: "doc", content: "x".repeat(5000) };

const product = {
  id: "p1",
  name: "Daikin FTKB25",
  slug: "daikin-ftkb25",
  nameAlign: "left",
  description: big,
  metaTitle: "t",
  metaDescription: "d",
  images: [
    { url: "https://img/1.webp", alt: "front", cropVariants: { card: "https://img/1-card.webp" } },
    { url: "https://img/2.webp" },
  ],
  displayPrice: 9000000,
  displayStockStatus: "in_stock",
  defaultVariantId: "v2",
  variants: [
    { id: "v1", sku: "SKU1", originalPrice: 1, discountPercent: 0, optionValueIds: ["a", "b"], components: [{ x: big }] },
    { id: "v2", sku: "SKU2", originalPrice: 10000000, discountPercent: 10, optionValueIds: ["c"], components: [{ x: big }] },
  ],
  brand: { id: "b1", name: "Daikin", slug: "daikin", content: big, warrantyPolicy: "long", logoUrl: "" },
  category: { id: "c1", name: "Máy lạnh", slug: "may-lanh", metaTitle: "m", metaDescription: "n" },
} as unknown as ProductWithRelations;

describe("slimProductForCard", () => {
  it("keeps exactly what ProductCard renders", () => {
    const slim = slimProductForCard(product);
    expect(slim.name).toBe(product.name);
    expect(slim.slug).toBe(product.slug);
    expect(slim.displayPrice).toBe(9000000);
    expect(slim.displayStockStatus).toBe("in_stock");
    expect(slim.brand?.name).toBe("Daikin");
    expect(slim.category).toEqual({ id: "c1", name: "Máy lạnh", slug: "may-lanh" });
  });

  it("keeps only the first image, url and alt", () => {
    expect(slimProductForCard(product).images).toEqual([{ url: "https://img/1.webp", alt: "front" }]);
  });

  it("keeps only the default variant with its price fields", () => {
    const slim = slimProductForCard(product);
    expect(slim.defaultVariantId).toBe("v2");
    expect(slim.variants).toEqual([{ id: "v2", originalPrice: 10000000, discountPercent: 10 }]);
  });

  it("drops long-form and brand content", () => {
    const slim = slimProductForCard(product);
    expect(slim.description).toBeNull();
    expect(slim.metaDescription).toBeUndefined();
    expect(slim.brand?.content).toBeUndefined();
  });

  it("shrinks the serialized payload", () => {
    expect(JSON.stringify(slimProductForCard(product)).length).toBeLessThan(
      JSON.stringify(product).length / 20,
    );
  });

  it("does not mutate the input", () => {
    slimProductForCard(product);
    expect(product.description).toBe(big);
    expect(product.images).toHaveLength(2);
  });
});
