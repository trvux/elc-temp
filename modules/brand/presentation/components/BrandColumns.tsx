"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Brand } from "../../domain";
import { Button } from "@/shared/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Image from "next/image";

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
      <div className="w-12 h-12 relative border border-border/40 rounded bg-white flex items-center justify-center p-1">
        {row.original.logoUrl ? (
          <Image
            src={row.original.logoUrl}
            alt={row.original.name}
            fill
            className="object-contain p-1"
          />
        ) : (
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter text-center">No Logo</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Tên thương hiệu",
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => onEdit(row.original)}
        >
          <Pencil size={14} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(row.original.id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    ),
  },
];
