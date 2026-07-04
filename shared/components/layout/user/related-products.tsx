import { TypographyH2 } from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductWithRelations } from "@/modules/catalog/domain";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { cacheLife, cacheTag } from "next/cache";
import { extractProductHp } from "@/shared/lib/seo-utils";

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
  brandId?: string;
}

const STYLES = {
  section: cn("w-full"),
  title: cn("mb-10"),
  grid: cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"),
};

export async function getCachedRelatedProducts(
  categoryId: string,
  currentProductId: string,
  brandId?: string,
  currentProductHp?: string,
): Promise<ProductWithRelations[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products-list");

  // Fetch one extra so excluding the current product (Go's ProductFilter has no
  // "neq id" equivalent) still leaves up to 30 results, same as the old
  // `.limit(30)` after `.neq("id", currentProductId)` at the SQL layer.
  const { data: fetched } = await getProductsAction({
    categoryId,
    isPublished: true,
    sortBy: "newest",
    limit: 31,
  });

  let mapped = fetched.filter((p) => p.id !== currentProductId).slice(0, 30);

  // Go's ProductFilter has no equivalent to the old "order by brand_id" trick
  // used to cheaply cluster same-brand products first when no HP match exists —
  // re-sort client-side instead, same spirit as the HP-based re-sort below.
  if (brandId) {
    mapped = [...mapped].sort((a, b) => {
      const aSameBrand = a.brandId === brandId;
      const bSameBrand = b.brandId === brandId;
      if (aSameBrand && !bSameBrand) return -1;
      if (!aSameBrand && bSameBrand) return 1;
      return 0;
    });
  }

  if (currentProductHp) {
    const cleanCurrentHp = currentProductHp.toLowerCase().replace(/\s+/g, "");

    mapped.sort((a, b) => {
      const aHp = extractProductHp(a).toLowerCase().replace(/\s+/g, "");
      const bHp = extractProductHp(b).toLowerCase().replace(/\s+/g, "");

      const aSameHp = aHp && aHp === cleanCurrentHp;
      const bSameHp = bHp && bHp === cleanCurrentHp;

      if (aSameHp && !bSameHp) return -1;
      if (!aSameHp && bSameHp) return 1;

      const aSameBrand = a.brandId === brandId;
      const bSameBrand = b.brandId === brandId;

      if (aSameBrand && !bSameBrand) return -1;
      if (!aSameBrand && bSameBrand) return 1;

      return 0;
    });
  }

  return mapped;
}

export default async function RelatedProducts({
  categoryId,
  currentProductId,
  brandId,
  product,
}: RelatedProductsProps & { product?: ProductWithRelations }) {
  const currentHp = product ? extractProductHp(product) : undefined;
  const products = await getCachedRelatedProducts(categoryId, currentProductId, brandId, currentHp);

  if (products.length === 0) return null;

  const productsToShow = products.slice(0, 8);

  return (
    <section className={STYLES.section}>
      <TypographyH2 className={STYLES.title}>Sản phẩm liên quan</TypographyH2>
      <div className={STYLES.grid}>
        {productsToShow.map((product) => (
          <ProductCard key={product.id} product={product} priority={false} />
        ))}
      </div>
    </section>
  );
}
