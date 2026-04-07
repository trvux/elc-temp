"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Pencil, Trash2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";

export type ProjectRow = {
  id: string;
  title: string;
  images: string[];
  is_published: boolean;
  order_index: number;
  categories?: { name: string };
};

interface ColumnProps {
  onEdit: (project: ProjectRow) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<ProjectRow>[] => [
  {
    accessorKey: "images",
    header: "Ảnh",
    cell: ({ row }) => {
      const images = row.original.images;
      const title = row.original.title;
      return images?.[0] ? (
        <div className="w-10">
          <AspectRatio ratio={1 / 1}>
            <Image
              src={images[0]}
              alt={title}
              fill
              className="rounded object-cover"
            />
          </AspectRatio>
        </div>
      ) : (
        <div className="w-[40px] h-[40px] bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground/40 text-[9px] font-bold leading-none text-center px-1 capitalize tracking-tighter">
          N/A
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Tên công trình",
    cell: ({ row }) => (
      <span className="text-sm font-semibold tracking-tight">
        {row.original.title}
      </span>
    ),
  },
  {
    accessorKey: "categories.name",
    header: "Danh mục",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground/80">
        {row.original.categories?.name || "—"}
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
    accessorKey: "order_index",
    header: "Thứ tự",
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const project = row.original;
      return (
        <ButtonGroup>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onEdit(project)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
