"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Pencil, Trash2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  images: string[];
  original_price: number;
  discount_percent: number;
  sale_price: number | null;
  is_featured: boolean;
  is_published: boolean;
  order_index: number;
  categories?: { name: string };
  brands?: { name: string };
};


interface ColumnProps {
  onEdit: (product: ProductRow) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<ProductRow>[] => [
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
    accessorKey: "brands.name",
    header: "Thương hiệu",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-[10px] font-bold capitalize tracking-wider bg-primary/5 text-primary border-primary/20">
        {row.original.brands?.name || "Khác"}
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
    accessorKey: "categories.name",
    header: "Danh mục",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground/80">
        {row.original.categories?.name || "—"}
      </span>
    ),
  },
  {
    accessorKey: "original_price",
    header: "Giá gốc",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/30">
        {formatPrice(row.original.original_price)}
      </span>
    ),
  },
  {
    accessorKey: "sale_price",
    header: "Giá bán",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-primary tracking-tight">
            {formatPrice(p.sale_price || p.original_price)}
          </span>
          {p.discount_percent > 0 && (
            <span className="text-[10px] text-destructive font-bold capitalize tracking-wider">
              SAVE {p.discount_percent}%
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "is_featured",
    header: "Nổi bật",
    cell: ({ row }) => (
      <Badge variant={row.original.is_featured ? "default" : "outline"}>
        {row.original.is_featured ? "Nổi bật" : "Thường"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_published",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.is_published ? "default" : "secondary"}>
        {row.original.is_published ? "Hiện" : "Ẩn"}
      </Badge>
    ),
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
