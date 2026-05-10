"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, Pencil, Trash2 } from "lucide-react";

import { Category } from "@/modules/category/domain/types";

export type CategoryRow = Category & {
  level: number;
};

interface ColumnProps {
  onEdit: (category: CategoryRow) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<CategoryRow>[] => [
  {
    accessorKey: "name",
    header: "Tên danh mục",
    cell: ({ row }) => {
      const level = row.original.level;
      return (
        <div className="flex items-center">
          {level > 0 &&
            Array.from({ length: level }).map((_, i) => (
              <div key={i} className="flex items-center pl-4">
                <CornerDownRight size={14} className="shrink-0" />
              </div>
            ))}
          <span>{row.original.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "slug",
    header: "Slug / Đường dẫn",
    cell: ({ row }) => {
      const slug = row.original.slug;
      return <span>{slug || "—"}</span>;
    },
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const type = row.original.type;
      const level = row.original.level;
      return (
        <Badge variant={level === 0 ? "default" : "secondary"}>
          {type === "PRODUCT" ? "Sản phẩm" : "Dự án"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "level",
    header: "Cấp",
    cell: ({ row }) => <span>Cấp {row.original.level + 1}</span>,
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const category = row.original;
      return (
        <ButtonGroup>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onEdit(category)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
