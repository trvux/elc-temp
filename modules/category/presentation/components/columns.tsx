import { ColumnDef } from "@tanstack/react-table";
import { PencilSimple, Trash, Star, Minus, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import Image from "next/image";
import { CategoryWithGroup } from "../../domain";

import { ButtonGroup } from "@/shared/components/ui/button-group";

export type CategoryRow = CategoryWithGroup;

interface ColumnsProps {
  onEdit: (cat: CategoryWithGroup) => void;
  onDelete: (id: string) => void;
}

export function getColumns({ onEdit, onDelete }: ColumnsProps): ColumnDef<CategoryRow>[] {
  return [
    {
      accessorKey: "imageUrl",
      header: "Ảnh",
      cell: ({ row }) => {
        const imageUrl = row.original.imageUrl;
        const name = row.original.name;
        return imageUrl ? (
          <div className="w-10">
            <AspectRatio ratio={1 / 1}>
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="rounded object-cover border bg-muted/20"
                sizes="40px"
              />
            </AspectRatio>
          </div>
        ) : (
          <div className="w-[40px] h-[40px] bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground/40 text-[9px] font-bold leading-none text-center px-1 capitalize tracking-tighter">
            N/A
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Tên danh mục",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm text-foreground">{row.original.name}</span>
          {row.original.slug && (
            <a
              href={`/san-pham/${row.original.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-foreground/75 hover:text-foreground hover:underline flex items-center gap-1 w-fit"
            >
              /{row.original.slug}
              <ArrowSquareOut size={11} />
            </a>
          )}
        </div>
      ),
    },
    {
      accessorKey: "group.name",
      header: "Nhóm danh mục",
      cell: ({ row }) => {
        const groupName = row.original.group?.name;
        return (
          <span className={groupName ? "text-foreground/90 font-medium text-xs bg-muted/80 dark:bg-muted/30 px-2 py-1 rounded-md border border-border" : "text-muted-foreground italic text-xs"}>
            {groupName || "Không thuộc nhóm nào"}
          </span>
        );
      },
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
      accessorKey: "orderIndex",
      header: "Thứ tự",
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return <span className="text-muted-foreground">{date.toLocaleDateString("vi-VN")}</span>;
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
