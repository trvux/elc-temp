"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { PencilSimple, ArrowSquareOut, Minus, Star, Trash } from "@phosphor-icons/react";
import Image from "next/image";
import { ProjectTypeWithCategories } from "../../domain";

import { ButtonGroup } from "@/shared/components/ui/button-group";

export type ProjectTypeRow = ProjectTypeWithCategories;

interface ColumnsProps {
  onEdit: (st: ProjectTypeWithCategories) => void;
  onDelete: (id: string) => void;
}

export function getColumns({
  onEdit,
  onDelete,
}: ColumnsProps): ColumnDef<ProjectTypeRow>[] {
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
          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground/40 text-xs font-bold">
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
              className="text-xs text-foreground/75 hover:text-foreground hover:underline flex items-center gap-1 w-fit"
            >
              /{row.original.slug}
              <ArrowSquareOut size={11} />
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
          <div className="flex flex-col gap-2 py-1 max-w-70">
            {Object.entries(grouped).map(([groupName, catNames]) => (
              <div key={groupName} className="flex flex-col gap-1">
                <span className="font-semibold text-xs text-foreground w-fit">
                  {groupName}
                </span>
                <div className="flex flex-wrap gap-1">
                  {catNames.map((name) => (
                    <span
                      key={name}
                      className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                    >
                      {name}
                    </span>
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
              <PencilSimple size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(row.original.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash size={14} />
            </Button>
          </ButtonGroup>
        </div>
      ),
    },
  ];
}
