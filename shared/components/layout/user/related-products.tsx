
import { TypographyH2 } from "@/shared/components/ui/typography";
import { createClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductWithRelations, StockStatus, normalizeProductPrice } from "@/modules/catalog/domain";

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

export default async function RelatedProducts({
  categoryId,
  currentProductId,
  brandId,
}: RelatedProductsProps) {
  const supabase = await createClient();

  // Fetch related products in the same category
  const { data: rawProducts } = await supabase
    .from("products")
    .select(
      "*, categories(id, name, slug), brands(id, name, slug)",
    )
    .eq("category_id", categoryId)
    .neq("id", currentProductId)
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("brand_id", { ascending: brandId ? false : true })
    .order("created_at", { ascending: false });

  if (!rawProducts || rawProducts.length === 0) return null;

  // Map snake_case to camelCase for ProductCard compatibility
  const products: ProductWithRelations[] = rawProducts.map((p) => {
    const { originalPrice, salePrice, discountPercent } = normalizeProductPrice(
      p.original_price,
      p.sale_price,
      p.discount_percent
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


  return (
    <section className={STYLES.section}>
      <TypographyH2 className={STYLES.title}>Sản phẩm liên quan</TypographyH2>
      <div className={STYLES.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={false}
          />
        ))}
      </div>
    </section>
  );
}
