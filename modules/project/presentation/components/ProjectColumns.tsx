"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Pencil, Trash2, Star, Check, X, Minus } from "lucide-react";
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
      <div className="flex flex-col">
        <span>
          {row.original.title}
        </span>
        <span>
          {row.original.slug}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "category.name",
    header: "Danh mục",
    cell: ({ row }) => (
      <span>
        {row.original.category?.name || "—"}
      </span>
    ),
  },
  {
    accessorKey: "isFeatured",
    header: "Nổi bật",
    cell: ({ row }) => (
      <Badge variant={row.original.isFeatured ? "secondary" : "outline"}>
        {row.original.isFeatured ? (
          <>
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>Nổi bật</span>
          </>
        ) : (
          <>
            <Minus size={12} />
            <span>Thường</span>
          </>
        )}
      </Badge>
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
