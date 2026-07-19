import { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { InView } from "@/shared/components/motion-primitives/in-view";
import { cn } from "@/shared/lib/utils";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

const REVEAL_VARIANTS = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

interface ProductGridProps {
  products: ProductWithRelations[];
  className?: string;
}

// Shared by ProductListModule, ProductDetailModule's related-products
// section, and the /san-pham hub's category-sections-grid — previously each
// of the three hand-copied the same GRID_CLASS string. Every card fades/
// slides in on scroll via InView.
export function ProductGrid({ products, className }: ProductGridProps) {
  return (
    <div className={cn(GRID_CLASS, className)}>
      {products.map((product, i) => (
        <InView
          key={product.id}
          viewOptions={{ once: true, margin: "0px 0px -80px 0px" }}
          variants={REVEAL_VARIANTS}
          transition={{ duration: 0.4, delay: Math.min(i, 5) * 0.05, ease: "easeOut" }}
        >
          <ProductCard product={product} priority={i < 8} />
        </InView>
      ))}
    </div>
  );
}
