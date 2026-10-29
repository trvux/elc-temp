import type { ProductWithRelations } from "@/modules/catalog/domain";

// ProductCard never reads the long-form fields below, but every product handed
// from a Server Component to the client FeaturesSection is serialized into the
// RSC payload in full. On the homepage that was ~90 products x (description +
// brand/category content) = ~1 MB of inline JSON, which buries the visible
// text for crawlers/agents that don't run JS. Strip them server-side; the
// shape stays a ProductWithRelations so ProductCard keeps working untouched.
export function slimProductForCard(product: ProductWithRelations): ProductWithRelations {
  return {
    ...product,
    description: null,
    metaTitle: undefined,
    metaDescription: undefined,
    brand: product.brand
      ? {
          ...product.brand,
          content: undefined,
          warrantyPolicy: undefined,
          metaTitle: undefined,
          metaDescription: undefined,
        }
      : product.brand,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : product.category,
  };
}
