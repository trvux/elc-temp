"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Pencil, Trash2, Star } from "lucide-react";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import Image from "next/image";
import { ProjectWithCategory } from "../../domain";

interface ColumnProps {
  onEdit: (project: ProjectWithCategory) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<ProjectWithCategory>[] => [
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
              sizes="40px"
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
    header: "Tên dự án",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold tracking-tight">
          {row.original.title}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {row.original.slug}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "category.name",
    header: "Danh mục",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground/80">
        {row.original.category?.name || "—"}
      </span>
    ),
  },
  {
    accessorKey: "isPublished",
    header: "Trạng thái",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-2">
        <Badge variant={row.original.isPublished ? "default" : "secondary"}>
          {row.original.isPublished ? "Hiện" : "Ẩn"}
        </Badge>
        {row.original.isFeatured && (
          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 gap-1 px-1.5">
            <Star size={10} fill="currentColor" />
            Nổi bật
          </Badge>
        )}
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
