import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { ProductWithRelations } from "../../domain/types";
import { ProductCard } from "./ProductCard";

interface ProductListProps {
  products: ProductWithRelations[];
}

export const ProductList: React.FC<ProductListProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không tìm thấy sản phẩm nào.</p>
      </div>
    );
  }

  return (
    <motion.div 
      layout
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {products.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              opacity: { duration: 0.2 }
            }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
