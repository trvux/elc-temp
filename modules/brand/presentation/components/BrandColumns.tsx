"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Brand } from "../../domain";
import { PencilSimple, Trash, ArrowSquareOut, Star, Minus } from "@phosphor-icons/react";
import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Badge } from "@/shared/components/ui/badge";

interface BrandColumnsProps {
  onEdit: (brand: Brand) => void;
  onDelete: (id: string) => void;
}

export const getBrandColumns = ({
  onEdit,
  onDelete,
}: BrandColumnsProps): ColumnDef<Brand>[] => [
  {
    accessorKey: "logoUrl",
    header: "Logo",
    cell: ({ row }) => (
      <div className="w-12 h-12 relative border border-border/40 rounded flex items-center justify-center p-1">
        {row.original.logoUrl ? (
          <Image
            src={row.original.logoUrl}
            alt={row.original.name}
            fill
            sizes="48px"
            className="object-contain p-1"
          />
        ) : (
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter text-center">No Logo</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Tên thương hiệu",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-sm text-foreground">{row.original.name}</span>
        {row.original.slug && (
          <a
            href={`/san-pham/all/${row.original.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-foreground/75 hover:text-foreground hover:underline flex items-center gap-1 w-fit"
          >
            /{row.original.slug}
            <ArrowSquareOut size={11} />
          </a>
        )}
      </div>
    ),
  },
  {
    accessorKey: "isFeatured",
    header: "Nổi bật",
    cell: ({ row }) => (
      <Badge variant={row.original.isFeatured ? "secondary" : "outline"}>
        {row.original.isFeatured ? (
          <>
            <Star size={12} className="fill-amber-400 text-amber-400 mr-1" />
            <span>Nổi bật</span>
          </>
        ) : (
          <>
            <Minus size={12} className="mr-1" />
            <span>Thường</span>
          </>
        )}
      </Badge>
    ),
  },
  {
    accessorKey: "orderIndex",
    header: "Thứ tự",
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <ButtonGroup>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
          className="h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <PencilSimple size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash size={14} />
        </Button>
      </ButtonGroup>
    ),
  },
];
