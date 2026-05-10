"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Branch } from "../../domain/types";

interface ColumnProps {
  onEdit: (branch: Branch) => void;
  onDelete: (id: string) => void;
}

export const getBranchColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<Branch>[] => [
  {
    accessorKey: "name",
    header: "Tên chi nhánh",
    cell: ({ row }) => (
      <span>
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "slug",
    header: "URL",
    cell: ({ row }) => (
      <span>
        /chi-nhanh/{row.original.slug}
      </span>
    ),
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => (
      <span>
        {row.original.address || "—"}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Điện thoại",
    cell: ({ row }) => (
      <span>
        {row.original.phone || "—"}
      </span>
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
