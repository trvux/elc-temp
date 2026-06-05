import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Minus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { ServiceGroup } from "../../domain/types";

import { CategoryNewWithGroup } from "@/modules/category-new/domain/types";

interface ServiceGroupColumnsProps {
  categories: CategoryNewWithGroup[];
  onEdit: (group: ServiceGroup) => void;
  onDelete: (id: string) => void;
}

export const getServiceGroupColumns = ({
  categories,
  onEdit,
  onDelete,
}: ServiceGroupColumnsProps): ColumnDef<ServiceGroup>[] => [
  {
    accessorKey: "imageUrl",
    header: "Ảnh",
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl;
      const name = row.original.name;
      return imageUrl ? (
        <div className="w-10">
          <Image
            src={imageUrl}
            alt={name}
            width={40}
            height={30}
            className="rounded object-cover border bg-muted/20"
          />
        </div>
      ) : (
        <div className="w-10 h-10 bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground/40 text-[9px] font-bold leading-none text-center px-1 capitalize tracking-tighter">
          N/A
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Tên nhóm",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-sm text-foreground">
          {row.original.name}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {row.original.slug}
        </span>
      </div>
    ),
  },
  {
    id: "categories",
    header: "Dòng sản phẩm liên kết (Nhóm → Danh mục)",
    cell: ({ row }) => {
      const categoryIds = row.original.categoryIds || [];
      if (categoryIds.length === 0) {
        return (
          <span className="text-muted-foreground italic text-xs">
            Chưa có liên kết
          </span>
        );
      }

      // Map categoryIds to actual category objects
      const linkedCats = categoryIds
        .map((id) => categories.find((c) => c.id === id))
        .filter((c): c is CategoryNewWithGroup => !!c);

      if (linkedCats.length === 0) {
        return (
          <span className="text-muted-foreground italic text-xs">
            Chưa có liên kết
          </span>
        );
      }

      // Group categories by their product group name
      const grouped: Record<string, string[]> = {};
      linkedCats.forEach((cat) => {
        const groupName = cat.group?.name || "Khác";
        if (!grouped[groupName]) {
          grouped[groupName] = [];
        }
        grouped[groupName].push(cat.name);
      });

      return (
        <div className="flex flex-col gap-2 py-1 max-w-[650px]">
          {Object.entries(grouped).map(([groupName, catNames]) => (
            <div key={groupName} className="flex items-center gap-3 p-2">
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
    accessorKey: "orderIndex",
    header: "Thứ tự",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.orderIndex}</span>
    ),
  },
  {
    accessorKey: "isFeatured",
    header: "Nổi bật",
    cell: ({ row }) => (
      <Badge variant={row.original.isFeatured ? "secondary" : "outline"}>
        {row.original.isFeatured ? (
          <>
            <Star size={12} className="fill-amber-400 text-amber-400 mr-1" />
            <span>Nổi bật</span>
          </>
        ) : (
          <>
            <Minus size={12} className="mr-1" />
            <span>Thường</span>
          </>
        )}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-muted-foreground text-sm">
          {date.toLocaleDateString("vi-VN")}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const group = row.original;
      return (
        <ButtonGroup>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(group)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(group.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
