
import { TypographyH2 } from "@/shared/components/ui/typography";
import { createClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
  brandId?: string;
}

const STYLES = {
  section: cn("mt-20 border-t pt-16"),
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
  const products = rawProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    images: p.images,
    originalPrice: p.original_price,
    salePrice: p.sale_price,
    discountPercent: p.discount_percent,
    category: Array.isArray(p.categories) ? p.categories[0] : p.categories,
    brand: Array.isArray(p.brands) ? p.brands[0] : p.brands,
  }));

  return (
    <section className={STYLES.section}>
      <TypographyH2 className={STYLES.title}>Sản phẩm liên quan</TypographyH2>
      <div className={STYLES.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categorySlug={product.category?.slug || "all"}
            brandSlug={product.brand?.slug || "all"}
            priority={false}
          />
        ))}
      </div>
    </section>
  );
}
