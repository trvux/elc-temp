"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Edit2, Trash2, Check, X } from "lucide-react";
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
    accessorKey: "imageUrl",
    header: "Ảnh",
    cell: ({ row }) => (
      <div className="relative h-10 w-16 overflow-hidden rounded-md border bg-muted">
        {row.original.imageUrl ? (
          <img
            src={row.original.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-wider text-muted-foreground/40">
            No Image
          </div>
        )}
      </div>
    ),
  },
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
            variant="ghost"
            size="icon"
            onClick={() => onEdit(branch)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(branch.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
