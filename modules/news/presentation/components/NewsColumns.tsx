"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { PencilSimple, Trash, ArrowSquareOut } from "@phosphor-icons/react";
import Image from "next/image";
import { News } from "../../domain";

interface ColumnProps {
  onEdit: (news: News) => void;
  onDelete: (id: string) => void;
}

export const getNewsColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<News>[] => [
  {
    accessorKey: "image",
    header: "Ảnh",
    cell: ({ row }) => (
      <div className="relative h-10 w-16 rounded overflow-hidden border bg-muted">
        {row.original.image ? (
          <Image
            src={row.original.image}
            alt={row.original.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: "Tiêu đề",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {row.original.title}
        </span>
        <span className="text-[10px] text-muted-foreground">
          Thứ tự: {row.original.orderIndex}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "slug",
    header: "URL",
    cell: ({ row }) => (
      <a
        href={`/tin-tuc/${row.original.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-foreground/75 font-medium hover:text-foreground hover:underline flex items-center gap-1 transition-colors"
      >
        /tin-tuc/{row.original.slug}
        <ArrowSquareOut size={12} className="shrink-0" />
      </a>
    ),
  },
  {
    accessorKey: "isPublished",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? "default" : "secondary"}>
        {row.original.isPublished ? "Hiển thị" : "Ẩn"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {new Date(row.original.createdAt).toLocaleDateString("vi-VN")}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const news = row.original;
      return (
        <ButtonGroup>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(news)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <PencilSimple size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(news.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
