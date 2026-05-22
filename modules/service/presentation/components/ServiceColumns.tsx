"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Edit2, Trash2, ExternalLink, Check, X } from "lucide-react";
import Image from "next/image";
import { Service } from "../../domain";

interface ColumnProps {
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export const getServiceColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<Service>[] => [
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
        <span>
          {row.original.title}
        </span>
        <span>
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
        href={`/dich-vu/${row.original.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1"
      >
        /dich-vu/{row.original.slug}
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
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => (
      <span>
        {new Date(row.original.createdAt).toLocaleDateString("vi-VN")}
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
            variant="ghost"
            size="icon"
            onClick={() => onEdit(service)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(service.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
