"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { Page } from "../../domain";

interface ColumnProps {
  onEdit: (page: Page) => void;
  onDelete: (id: string) => void;
}

export const getPageColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<Page>[] => [
  {
    accessorKey: "title",
    header: "Tiêu đề",
    cell: ({ row }) => (
      <span className="text-sm font-semibold tracking-tight text-foreground">
        {row.original.title}
      </span>
    ),
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
    accessorKey: "isPublished",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? "default" : "secondary"}>
        {row.original.isPublished ? "Hiển thị" : "Ẩn"}
      </Badge>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Cập nhật",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {new Date(row.original.updatedAt).toLocaleDateString("vi-VN")}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const page = row.original;
      return (
        <ButtonGroup>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onEdit(page)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(page.id)}
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
