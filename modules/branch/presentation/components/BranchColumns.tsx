"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { PencilSimple, Trash, Check, X } from "@phosphor-icons/react";
import { Branch } from "../../domain/types";
import { primaryImageUrl } from "@/shared/lib/image-asset";

interface ColumnProps {
  onEdit: (branch: Branch) => void;
  onDelete: (id: string) => void;
}

export const getBranchColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<Branch>[] => [
  {
    accessorKey: "images",
    header: "Ảnh",
    cell: ({ row }) => {
      const imageUrl = primaryImageUrl(row.original.images);
      return (
        <div className="relative h-10 w-16 overflow-hidden rounded-md border bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={row.original.name || ""}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wider text-muted-foreground/40">
              No Image
            </div>
          )}
        </div>
      );
    },
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
        /co-so-ha-tang/{row.original.slug}
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
            <PencilSimple size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(branch.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
