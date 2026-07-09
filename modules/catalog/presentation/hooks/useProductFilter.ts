import { useState, useMemo } from "react";
import { ProductWithRelations } from "../../domain/types";

export const useProductFilter = (products: ProductWithRelations[]) => {
  const [categoryId, setCategoryId] = useState<string>("all");
  const [brandId, setBrandId] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("featured");

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categoryId !== "all") {
      result = result.filter((p) => p.categoryId === categoryId);
    }

    if (brandId !== "all") {
      result = result.filter((p) => p.brandId === brandId);
    }

    if (sortOrder === "price-asc") {
      result.sort((a, b) => (a.displayPrice || 0) - (b.displayPrice || 0));
    } else if (sortOrder === "price-desc") {
      result.sort((a, b) => (b.displayPrice || 0) - (a.displayPrice || 0));
    } else if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [products, categoryId, brandId, sortOrder]);

  return {
    filteredProducts,
    categoryId,
    setCategoryId,
    brandId,
    setBrandId,
    sortOrder,
    setSortOrder,
  };
};
