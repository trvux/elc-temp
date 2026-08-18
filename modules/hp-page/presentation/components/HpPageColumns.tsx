"use client";

import { ColumnDef } from "@tanstack/react-table";
import { HpPage } from "../../domain";
import { PencilSimple, Trash, ArrowSquareOut } from "@phosphor-icons/react";
import Image from "next/image";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";

interface HpPageColumnsProps {
  onEdit: (page: HpPage) => void;
  onDelete: (id: string) => void;
}

export const getHpPageColumns = ({
  onEdit,
  onDelete,
}: HpPageColumnsProps): ColumnDef<HpPage>[] => [
  {
    accessorKey: "imageUrl",
    header: "Ảnh",
    cell: ({ row }) => (
      <div className="w-12 h-12 relative border border-border/40 rounded flex items-center justify-center p-1">
        {row.original.imageUrl ? (
          <Image
            src={row.original.imageUrl}
            alt={row.original.name}
            fill
            sizes="48px"
            className="object-contain p-1"
          />
        ) : (
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter text-center">No Image</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Tên trang",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-sm text-foreground">{row.original.name}</span>
        {row.original.slug && (
          <a
            href={`/san-pham/${row.original.slug}`}
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
    accessorKey: "attributeValues",
    header: "Giá trị lọc",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1 max-w-55">
        {row.original.attributeValues.map((v) => (
          <Badge key={v} variant="outline" className="text-xs">
            {v}
          </Badge>
        ))}
      </div>
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
