import type { ProductVariant, ProductWithRelations } from "@/modules/catalog/domain";
import { resolveDefaultVariant } from "@/modules/catalog/domain";

// ProductCard renders: name, slug, first image (url + alt), stock badge,
// display price, brand name, and the default variant's original price and
// discount. Every product handed to a client component (FeaturesSection,
// CategorySectionsGrid, the "Xem thêm" API) is serialized into the page a
// second time as RSC payload, so send exactly that and nothing else.
//
// A full product is ~14KB (a 10KB rich-text description, every image with its
// crop variants, every variant with option ids and components, brand content);
// a card needs ~0.6KB. The old version only blanked a few long fields and
// still shipped ~2.5KB per product; /san-pham did not slim at all.
//
// The shape stays a ProductWithRelations so ProductCard keeps working
// untouched. This is an allowlist on purpose: a field added to the API later
// does not silently start inflating every listing page.
export function slimProductForCard(product: ProductWithRelations): ProductWithRelations {
  const defaultVariant = resolveDefaultVariant(product);
  const firstImage = product.images?.[0];

  const slim = {
    id: product.id,
    name: product.name,
    nameAlign: product.nameAlign,
    slug: product.slug,
    description: null,
    images: firstImage ? [{ url: firstImage.url, alt: firstImage.alt }] : [],
    displayPrice: product.displayPrice,
    displayStockStatus: product.displayStockStatus,
    defaultVariantId: defaultVariant?.id ?? product.defaultVariantId,
    variants: defaultVariant
      ? [
          {
            id: defaultVariant.id,
            originalPrice: defaultVariant.originalPrice,
            discountPercent: defaultVariant.discountPercent,
          } as ProductVariant,
        ]
      : [],
    brand: product.brand ? { id: product.brand.id, name: product.brand.name, slug: product.brand.slug } : product.brand,
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : product.category,
  };

  return slim as unknown as ProductWithRelations;
}
