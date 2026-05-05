import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import { formatPrice } from "@/shared/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ProductWithRelations } from "../../domain/types";

interface ProductCardProps {
  product: ProductWithRelations;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const categorySlug = product.category?.slug || "uncategorized";

  return (
    <Card className="overflow-hidden h-full flex flex-col group hover:shadow-lg transition-shadow duration-300">
      <Link
        href={`/san-pham/${categorySlug}/${product.slug}`}
        className="relative aspect-square block overflow-hidden"
      >
        <Image
          src={product.images?.[0] || "/placeholder.png"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.discountPercent > 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            -{product.discountPercent}%
          </Badge>
        )}
      </Link>
      <CardContent className="p-4 flex-grow">
        <div className="text-xs text-muted-foreground mb-1 capitalize">
          {product.brand?.name}
        </div>
        <Link href={`/san-pham/${categorySlug}/${product.slug}`}>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          {product.salePrice ? (
            <>
              <span className="text-primary font-bold">
                {formatPrice(product.salePrice)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            </>
          ) : (
            <span className="text-primary font-bold">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.shortDescription}
        </p>
      </CardFooter>
    </Card>
  );
};
