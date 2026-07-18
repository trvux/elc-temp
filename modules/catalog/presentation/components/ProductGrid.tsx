import { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { InView } from "@/shared/components/motion-primitives/in-view";
import { cn } from "@/shared/lib/utils";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

const REVEAL_VARIANTS = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

// Cap regardless of how many products an admin flags isFeatured — a
// category with 10 featured products would otherwise break the "standout
// row" layout below the intended visual hierarchy.
const MAX_FEATURED = 3;

interface ProductGridProps {
  products: ProductWithRelations[];
  // Show up to this many isFeatured products (sorted by orderIndex) as a
  // standout row above the main dense grid — visual hierarchy instead of a
  // flat grid where every card looks identical. 0 (default) = no standout
  // row, every product renders in the dense grid.
  featuredCount?: number;
  className?: string;
}

// Shared by ProductListModule, ProductDetailModule's related-products
// section, and the /san-pham hub's category-sections-grid — previously each
// of the three hand-copied the same GRID_CLASS string.
export function ProductGrid({ products, featuredCount = 0, className }: ProductGridProps) {
  const cap = Math.min(featuredCount, MAX_FEATURED);
  const featured = cap > 0
    ? [...products].filter((p) => p.isFeatured).sort((a, b) => a.orderIndex - b.orderIndex).slice(0, cap)
    : [];
  const featuredIds = new Set(featured.map((p) => p.id));
  const rest = products.filter((p) => !featuredIds.has(p.id));

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {featured.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product, i) => (
            <InView
              key={product.id}
              viewOptions={{ once: true }}
              variants={REVEAL_VARIANTS}
              transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
            >
              <ProductCard product={product} priority={i < 2} size="lg" />
            </InView>
          ))}
        </div>
      )}

      <div className={GRID_CLASS}>
        {rest.map((product, i) => (
          <InView
            key={product.id}
            viewOptions={{ once: true, margin: "0px 0px -80px 0px" }}
            variants={REVEAL_VARIANTS}
            transition={{ duration: 0.4, delay: Math.min(i, 5) * 0.05, ease: "easeOut" }}
          >
            <ProductCard product={product} priority={featured.length === 0 && i < 8} />
          </InView>
        ))}
      </div>
    </div>
  );
}
