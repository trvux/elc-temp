"use client";

import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { formatPrice } from "@/shared/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Check, Minus, Pencil, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
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
          <AspectRatio ratio={19 / 9}>
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
    cell: ({ row }) => {
      const p = row.original;
      const url = `/san-pham/${p.category?.slug || "all"}/${p.brand?.slug || "all"}/${p.slug}`;
      return (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{p.name}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline font-mono"
          >
            {url}
          </a>
        </div>
      );
    },
  },
  {
    accessorKey: "brand.name",
    header: "Thương hiệu",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.brand?.name || "Khác"}</Badge>
    ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <span>{row.original.sku || "—"}</span>,
  },
  {
    accessorKey: "mpn",
    header: "MPN",
    cell: ({ row }) => (
      <span className="font-mono text-[10px]">{row.original.mpn || "—"}</span>
    ),
  },
  {
    accessorKey: "gtin",
    header: "GTIN",
    cell: ({ row }) => (
      <span className="font-mono text-[10px]">{row.original.gtin || "—"}</span>
    ),
  },
  {
    accessorKey: "category.name",
    header: "Danh mục",
    cell: ({ row }) => <span>{row.original.category?.name || "—"}</span>,
  },
  {
    accessorKey: "originalPrice",
    header: "Giá gốc",
    cell: ({ row }) => (
      <span className="line-through text-muted-foreground">
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
        <div className="flex flex-col">
          <span className="font-bold">
            {formatPrice(p.salePrice || p.originalPrice)}
          </span>
          {p.discountPercent > 0 && (
            <Badge variant="destructive" className="rounded-sm">
              -{p.discountPercent}%
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isFeatured",
    header: "Nổi bật",
    cell: ({ row }) => (
      <Badge variant={row.original.isFeatured ? "secondary" : "outline"}>
        {row.original.isFeatured ? (
          <>
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>Nổi bật</span>
          </>
        ) : (
          <>
            <Minus size={12} />
            <span>Thường</span>
          </>
        )}
      </Badge>
    ),
  },
  {
    accessorKey: "isPublished",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? "secondary" : "outline"}>
        {row.original.isPublished ? (
          <>
            <Check size={12} />
            <span>Hiện</span>
          </>
        ) : (
          <>
            <X size={12} />
            <span>Ẩn</span>
          </>
        )}
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
