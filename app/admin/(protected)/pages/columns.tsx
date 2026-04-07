"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ExternalLink } from "lucide-react";

export type PageRow = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  created_at: string;
};

interface ColumnProps {
  onEdit: (page: PageRow) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<PageRow>[] => [
  {
    accessorKey: "title",
    header: "Tiêu đề",
    cell: ({ row }) => <span className="text-sm font-semibold tracking-tight text-foreground">{row.original.title}</span>,
  },
  {
    accessorKey: "slug",
    header: "URL",
    cell: ({ row }) => (
      <a
        href={`/${row.original.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary font-medium hover:underline flex items-center gap-1 transition-colors"
      >
        /{row.original.slug}
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
      const page = row.original;
      return (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(page)}
          >
            <Pencil size={16} />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={() => onDelete(page.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      );
    },
  },
];
