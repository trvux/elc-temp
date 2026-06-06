"use client";

import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { ColumnDef } from "@tanstack/react-table";
import { Check, Minus, Edit2, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { ProductWithRelations, formatPrice, PRODUCT_LABELS, STOCK_STATUS_MAP, STOCK_STATUS } from "../../domain";
import { StockBadge } from "@/shared/components/ui/stock-badge";
import { cn } from "@/shared/lib/utils";

const LABEL_MAP: Record<string, string> = {
  [PRODUCT_LABELS.NEW]: "Mới về",
  [PRODUCT_LABELS.HOT]: "Hot",
  [PRODUCT_LABELS.BEST_SELLER]: "Bán chạy",
  [PRODUCT_LABELS.SALE]: "Sale",
};

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
        <div className="w-10 h-10 bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground/40 text-[9px] font-bold leading-none text-center px-1 capitalize tracking-tighter">
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
            className="text-[10px] text-foreground/75 hover:text-foreground hover:underline font-mono"
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
            <Badge variant="destructive">
              -{p.discountPercent}%
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "labels",
    header: "Nhãn",
    cell: ({ row }) => {
      const labels = row.original.labels || [];
      if (labels.length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-wrap gap-1 max-w-[120px]">
          {labels.map((l) => (
            <Badge key={l} variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
              {LABEL_MAP[l] || l}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "stockStatus",
    header: "Kho",
    cell: ({ row }) => {
      const status = row.original.stockStatus;
      if (!status) return <span className="text-muted-foreground">—</span>;
      
      return (
        <StockBadge status={status || undefined} className="whitespace-nowrap px-2 py-0 h-5 text-[10px]" />
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
            variant="ghost"
            size="icon"
            onClick={() => onEdit(product)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(product.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
