"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2, ExternalLink, Minus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { ServiceTypeWithCategories } from "../../domain";

import { ButtonGroup } from "@/shared/components/ui/button-group";

export type ServiceTypeRow = ServiceTypeWithCategories;

interface ColumnsProps {
  onEdit: (st: ServiceTypeWithCategories) => void;
  onDelete: (id: string) => void;
}

export function getColumns({
  onEdit,
  onDelete,
}: ColumnsProps): ColumnDef<ServiceTypeRow>[] {
  return [
    {
      accessorKey: "image",
      header: "Ảnh",
      cell: ({ row }) => {
        const image = row.original.image;
        const name = row.original.name;
        return image ? (
          <div className="w-10 h-10 relative rounded-md overflow-hidden border">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground/40 text-[9px] font-bold">
            N/A
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Tên loại hình",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm text-foreground">{row.original.name}</span>
          {row.original.slug && (
            <a
              href={`/${row.original.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary hover:underline flex items-center gap-1 w-fit"
            >
              /{row.original.slug}
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      ),
    },
    {
      id: "categories",
      header: "Dòng sản phẩm liên kết (Nhóm → Danh mục)",
      cell: ({ row }) => {
        const categories = row.original.categories || [];
        if (categories.length === 0) {
          return (
            <span className="text-muted-foreground italic text-xs">
              Chưa có liên kết
            </span>
          );
        }

        // Group categories by their product group name
        const grouped: Record<string, string[]> = {};
        categories.forEach((cat) => {
          const groupName = cat.group?.name || "Khác";
          if (!grouped[groupName]) {
            grouped[groupName] = [];
          }
          grouped[groupName].push(cat.name);
        });

        return (
          <div className="flex flex-col gap-2 py-1 max-w-[650px]">
            {Object.entries(grouped).map(([groupName, catNames]) => (
              <div
                key={groupName}
                className="flex items-center gap-3 border border-border rounded-sm p-2"
              >
                {/* Group Column - Using standard Shadcn Badge */}
                <div className="w-[140px] shrink-0">
                  <span className="w-full justify-center py-1 truncate text-xs font-semibold">
                    {groupName}
                  </span>
                </div>
                {/* Categories Column - Standard Shadcn Badges */}
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {catNames.map((name) => (
                    <Badge
                      key={name}
                      variant="secondary"
                      className="whitespace-nowrap font-normal"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "isFeatured",
      header: "Nổi bật",
      cell: ({ row }) => (
        <Badge variant={row.original.isFeatured ? "secondary" : "outline"} className="gap-1">
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
      accessorKey: "orderIndex",
      header: "Thứ tự",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-muted-foreground">
          {row.original.orderIndex}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-muted-foreground text-xs">
            {date.toLocaleDateString("vi-VN")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ButtonGroup>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(row.original)}
              className="h-8 w-8 text-muted-foreground hover:text-primary"
            >
              <Edit2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(row.original.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={14} />
            </Button>
          </ButtonGroup>
        </div>
      ),
    },
  ];
}
