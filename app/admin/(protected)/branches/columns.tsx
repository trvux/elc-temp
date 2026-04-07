"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Pencil, Trash2 } from "lucide-react";

export type BranchRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  is_published: boolean;
};

interface ColumnProps {
  onEdit: (branch: BranchRow) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<BranchRow>[] => [
  {
    accessorKey: "name",
    header: "Tên chi nhánh",
    cell: ({ row }) => (
      <span className="text-sm font-semibold tracking-tight">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "slug",
    header: "URL",
    cell: ({ row }) => (
      <code className="text-xs bg-muted/50 px-2 py-0.5 rounded font-mono text-muted-foreground/80">
        /chi-nhanh/{row.original.slug}
      </code>
    ),
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground/70 truncate max-w-[250px] inline-block">
        {row.original.address || "—"}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Điện thoại",
    cell: ({ row }) => (
      <span className="text-sm font-medium whitespace-nowrap">
        {row.original.phone || "—"}
      </span>
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
      const branch = row.original;
      return (
        <ButtonGroup>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onEdit(branch)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(branch.id)}
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
