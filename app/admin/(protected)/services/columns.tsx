"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import Image from "next/image";

export type ServiceRow = {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
};

interface ColumnProps {
  onEdit: (service: ServiceRow) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<ServiceRow>[] => [
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
          Thứ tự: {row.original.order_index}
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
        className="text-xs text-primary font-medium hover:underline flex items-center gap-1 transition-colors"
      >
        /tin-tuc/{row.original.slug}
        <ExternalLink size={12} className="shrink-0" />
      </a>
    ),
  },
  {
    accessorKey: "is_published",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.is_published ? "default" : "secondary"}>
        {row.original.is_published ? "Hiển thị" : "Ẩn"}
      </Badge>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {new Date(row.original.created_at).toLocaleDateString("vi-VN")}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const service = row.original;
      return (
        <ButtonGroup>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onEdit(service)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(service.id)}
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
