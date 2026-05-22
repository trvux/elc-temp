"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Edit2, Trash2, ExternalLink, Check, X } from "lucide-react";
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
      <span>
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
        className="flex items-center gap-1"
      >
        /{row.original.slug}
        <ExternalLink size={12} />
      </a>
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
    accessorKey: "updatedAt",
    header: "Cập nhật",
    cell: ({ row }) => (
      <span>
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
            variant="ghost"
            size="icon"
            onClick={() => onEdit(page)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(page.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
