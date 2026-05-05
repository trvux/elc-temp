"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Pencil, Trash2 } from "lucide-react";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import Image from "next/image";
import { formatPrice } from "@/shared/lib/utils";
import { ProductWithRelations } from "../../domain";

interface ColumnProps {
  onEdit: (product: ProductWithRelations) => void;
  onDelete: (id: string) => void;
}

export const getProductColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<ProductWithRelations>[] => [
  {
    accessorKey: "images",
    header: "Ảnh",
    cell: ({ row }) => {
      const images = row.original.images;
      const name = row.original.name;
      return images?.[0] ? (
        <div className="w-10">
          <AspectRatio ratio={1 / 1}>
            <Image
              src={images[0]}
              alt={name}
              fill
              className="rounded object-cover"
              sizes="40px"
            />
          </AspectRatio>
        </div>
      ) : (
        <div className="w-[40px] h-[40px] bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground/40 text-[9px] font-bold leading-none text-center px-1 capitalize tracking-tighter">
          N/A
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Tên sản phẩm",
    cell: ({ row }) => (
      <span className="text-sm font-semibold tracking-tight">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "brand.name",
    header: "Thương hiệu",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-[10px] font-bold capitalize tracking-wider bg-primary/5 text-primary border-primary/20">
        {row.original.brand?.name || "Khác"}
      </Badge>
    ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground">
        {row.original.sku || "—"}
      </span>
    ),
  },
  {
    accessorKey: "category.name",
    header: "Danh mục",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground/80">
        {row.original.category?.name || "—"}
      </span>
    ),
  },
  {
    accessorKey: "originalPrice",
    header: "Giá gốc",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/30">
        {formatPrice(row.original.originalPrice)}
      </span>
    ),
  },
  {
    accessorKey: "salePrice",
    header: "Giá bán",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-primary tracking-tight">
            {formatPrice(p.salePrice || p.originalPrice)}
          </span>
          {p.discountPercent > 0 && (
            <span className="text-[10px] text-destructive font-bold capitalize tracking-wider">
              SAVE {p.discountPercent}%
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isFeatured",
    header: "Nổi bật",
    cell: ({ row }) => (
      <Badge variant={row.original.isFeatured ? "default" : "outline"}>
        {row.original.isFeatured ? "Nổi bật" : "Thường"}
      </Badge>
    ),
  },
  {
    accessorKey: "isPublished",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? "default" : "secondary"}>
        {row.original.isPublished ? "Hiện" : "Ẩn"}
      </Badge>
    ),
  },
  {
    accessorKey: "stockStatus",
    header: "Tình trạng",
    cell: ({ row }) => {
      const status = row.original.stockStatus || "in_stock";
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        in_stock: "default",
        out_of_stock: "destructive",
        pre_order: "outline",
      };
      const labels: Record<string, string> = {
        in_stock: "Còn hàng",
        out_of_stock: "Hết hàng",
        pre_order: "Đặt trước",
      };
      return (
        <Badge variant={variants[status] || "secondary"}>
          {labels[status] || status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <ButtonGroup>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onEdit(product)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
