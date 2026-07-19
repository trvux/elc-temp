"use client";

import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { ColumnDef } from "@tanstack/react-table";
import { Minus, PencilSimple, Star, Trash } from "@phosphor-icons/react";
import Image from "next/image";
import { ProductWithRelations, formatPrice, PRODUCT_STATUS, PRODUCT_STATUS_MAP, resolveDefaultVariant, toLegacyStockStatusForBadge } from "../../domain";
import { StockBadge } from "@/shared/components/ui/stock-badge";
import { primaryImageUrl } from "@/shared/lib/image-asset";

interface ColumnProps {
  onEdit: (product: ProductWithRelations) => void;
  onDelete: (id: string) => void;
}

// Column set trimmed to match Shopify's list density (7 columns) — SKU/
// MPN/GTIN/Giá gốc/Thương hiệu were dropped from the list, they're
// internal/rarely-scanned-at-a-glance fields that live on the detail page
// (Tùy chọn & Biến thể card) instead. See the plan at
// /Users/tranvux/.claude/plans/majestic-whistling-raccoon.md.
export const getProductColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<ProductWithRelations>[] => [
  {
    accessorKey: "name",
    header: "Sản phẩm",
    cell: ({ row }) => {
      const p = row.original;
      const imageUrl = primaryImageUrl(p.images);
      const url = `/san-pham/${p.category?.slug || "all"}/${p.brand?.slug || "all"}/${p.slug}`;
      return (
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <div className="w-10 shrink-0">
              <AspectRatio ratio={19 / 9}>
                <Image src={imageUrl} alt={p.name} fill className="rounded object-cover" sizes="40px" />
              </AspectRatio>
            </div>
          ) : (
            <div className="w-10 h-10 shrink-0 bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground/40 text-xs font-bold leading-none text-center px-1 capitalize tracking-tighter">
              N/A
            </div>
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-medium truncate">{p.name}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-foreground/75 hover:text-foreground hover:underline font-mono truncate"
            >
              {url}
            </a>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category.name",
    header: "Danh mục",
    cell: ({ row }) => <span>{row.original.category?.name || "—"}</span>,
  },
  {
    id: "salePrice",
    header: "Giá bán",
    cell: ({ row }) => {
      const v = resolveDefaultVariant(row.original);
      return (
        <div className="flex flex-col">
          <span className="font-bold">
            {formatPrice(row.original.displayPrice ?? 0)}
          </span>
          {(v?.discountPercent ?? 0) > 0 && (
            <Badge variant="destructive">
              -{v?.discountPercent}%
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "stockStatus",
    header: "Kho",
    cell: ({ row }) => {
      const status = toLegacyStockStatusForBadge(row.original.displayStockStatus);
      if (!status) return <span className="text-muted-foreground">—</span>;

      return (
        <StockBadge status={status} className="whitespace-nowrap px-2 py-0 h-5 text-xs" />
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
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.status === PRODUCT_STATUS.PUBLISHED ? "secondary" : "outline"}>
        {PRODUCT_STATUS_MAP[row.original.status]}
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
            <PencilSimple size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(product.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
