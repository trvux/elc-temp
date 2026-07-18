import { ProductWithRelations, PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getProductsAction } from "@/modules/catalog/presentation/actions";

const RELATED_PRODUCTS_LIMIT = 8;

// getRelatedProducts implements the fallback chain decided for the product
// model: same ProductLine (siblings — different capacity/HP of the same
// dòng) is the primary source; if the product has no ProductLine, or the
// line has no other members, fall back to same category, then same brand.
// See elc_new_product_model_decided_2026_07_17 memory's "Related products"
// section — ProductLine plays no role in listing-page SEO, only here.
export async function getRelatedProducts(product: ProductWithRelations): Promise<ProductWithRelations[]> {
  const exclude = (products: ProductWithRelations[]) =>
    products.filter((p) => p.id !== product.id);

  if (product.productLineId) {
    const { data } = await getProductsAction({
      productLineId: product.productLineId,
      status: PRODUCT_STATUS.PUBLISHED,
      limit: RELATED_PRODUCTS_LIMIT + 1,
    });
    const related = exclude(data).slice(0, RELATED_PRODUCTS_LIMIT);
    if (related.length > 0) return related;
  }

  if (product.categoryId) {
    const { data } = await getProductsAction({
      categoryIds: [product.categoryId],
      status: PRODUCT_STATUS.PUBLISHED,
      limit: RELATED_PRODUCTS_LIMIT + 1,
    });
    const related = exclude(data).slice(0, RELATED_PRODUCTS_LIMIT);
    if (related.length > 0) return related;
  }

  if (product.brandId) {
    const { data } = await getProductsAction({
      brandIds: [product.brandId],
      status: PRODUCT_STATUS.PUBLISHED,
      limit: RELATED_PRODUCTS_LIMIT + 1,
    });
    return exclude(data).slice(0, RELATED_PRODUCTS_LIMIT);
  }

  return [];
}
