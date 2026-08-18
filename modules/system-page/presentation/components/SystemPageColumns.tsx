"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { PencilSimple, ArrowSquareOut } from "@phosphor-icons/react";
import { SystemPage } from "../../domain";

interface ColumnProps {
  onEdit: (systemPage: SystemPage) => void;
}

export const getSystemPageColumns = ({
  onEdit,
}: ColumnProps): ColumnDef<SystemPage>[] => [
  {
    accessorKey: "name",
    header: "Trang hệ thống",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "slug",
    header: "Đường dẫn",
    cell: ({ row }) => {
      const href = row.original.slug === "home" ? "/" : `/${row.original.slug}`;
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          {href}
          <ArrowSquareOut size={12} />
        </a>
      );
    },
  },
  {
    accessorKey: "metaTitle",
    header: "Tiêu đề SEO",
    cell: ({ row }) => (
      <span className="text-muted-foreground truncate max-w-50 block">
        {row.original.metaTitle || "Chưa cấu hình"}
      </span>
    ),
  },
  {
    accessorKey: "metaDescription",
    header: "Mô tả SEO",
    cell: ({ row }) => (
      <span className="text-muted-foreground truncate max-w-75 block">
        {row.original.metaDescription || "Chưa cấu hình"}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Cập nhật lần cuối",
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
      const systemPage = row.original;
      return (
        <ButtonGroup>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(systemPage)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <PencilSimple size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
