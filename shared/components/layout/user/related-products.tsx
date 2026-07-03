import { TypographyH2 } from "@/shared/components/ui/typography";
import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductWithRelations, StockStatus, normalizeProductPrice } from "@/modules/catalog/domain";
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
  setUseStaticClient(true);

  const supabase = await createClient();

  const { data: rawProducts } = await supabase
    .from("products")
    .select("*, categories(id, name, slug), brands(id, name, slug)")
    .eq("category_id", categoryId)
    .neq("id", currentProductId)
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("brand_id", { ascending: brandId ? false : true })
    .order("created_at", { ascending: false })
    .limit(30);

  if (!rawProducts) return [];

  const mapped = rawProducts.map((p) => {
    const { originalPrice, salePrice, discountPercent } = normalizeProductPrice(
      p.original_price,
      p.sale_price,
      p.discount_percent,
    );

    const categoryData = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    const brandData = Array.isArray(p.brands) ? p.brands[0] : p.brands;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || "",
      metaTitle: p.meta_title,
      metaDescription: p.meta_description,
      description: p.description || null,
      specs: p.specs || null,
      originalPrice,
      salePrice,
      discountPercent,
      images: p.images || [],
      labels: (p as { labels?: string[] }).labels || [],
      isFeatured: p.is_featured ?? false,
      isPublished: p.is_published ?? false,
      orderIndex: p.order_index ?? 0,
      categoryId: p.category_id || "",
      brandId: p.brand_id || "",
      stockStatus: (p.stock_status || "in_stock") as StockStatus,
      condition: (p.condition || "new") as "new" | "used",
      createdAt: p.created_at || "",
      updatedAt: p.updated_at || "",
      deletedAt: p.deleted_at || null,
      category: categoryData
        ? {
            id: categoryData.id,
            name: categoryData.name,
            slug: categoryData.slug,
            metaTitle: categoryData.meta_title || null,
            metaDescription: categoryData.meta_description || null,
          }
        : null,
      brand: brandData
        ? {
            id: brandData.id,
            name: brandData.name,
            slug: brandData.slug,
            logoUrl: brandData.logo_url || "",
            metaTitle: brandData.meta_title || null,
            metaDescription: brandData.meta_description || null,
            isFeatured: brandData.is_featured || false,
            orderIndex: brandData.order_index || 0,
            createdAt: brandData.created_at || "",
            updatedAt: brandData.updated_at || "",
            deletedAt: brandData.deleted_at || null,
          }
        : null,
    };
  });

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
