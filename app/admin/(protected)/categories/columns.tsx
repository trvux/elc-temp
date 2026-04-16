"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Pencil, Trash2, CornerDownRight } from "lucide-react";

export type CategoryRow = {
  id: string;
  name: string;
  type: "product" | "project";
  parent_id: string | null;
  slug: string;
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
                <CornerDownRight
                  size={14}
                  className="text-muted-foreground/20 shrink-0 mr-1.5"
                />
              </div>
            ))}
          <span
            className={
              level === 0
                ? "text-sm font-semibold tracking-tight"
                : "text-sm text-muted-foreground/80"
            }
          >
            {row.original.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "slug",
    header: "Slug / Đường dẫn",
    cell: ({ row }) => {
      const slug = row.original.slug;
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-muted-foreground font-mono font-medium">
          {slug || "N/A"}
        </code>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const type = row.original.type;
      const level = row.original.level;
      return (
        <Badge
          variant={type === "product" ? "default" : "secondary"}
          className={level > 0 ? "opacity-60" : ""}
        >
          {type === "product" ? "Sản phẩm" : "Dự án"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "level",
    header: "Cấp",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground/60 font-medium">
        Cấp {row.original.level + 1}
      </span>
    ),
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
