"use client";

import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import {
  ArrowSquareOut,
  Check,
  Minus,
  PencilSimple,
  Star,
  Trash,
  X,
} from "@phosphor-icons/react";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { ProjectWithCategory } from "../../domain";

interface ColumnProps {
  onEdit: (project: ProjectWithCategory) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<ProjectWithCategory>[] => [
  {
    accessorKey: "images",
    header: "Ảnh",
    cell: ({ row }) => {
      const images = row.original.images;
      const title = row.original.title;
      return images?.[0] ? (
        <div className="w-10">
          <AspectRatio ratio={1 / 1}>
            <Image
              src={images[0]}
              alt={title}
              fill
              className="rounded object-cover"
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
    accessorKey: "title",
    header: "Tên dự án",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">
          {row.original.title}
        </span>
        <a
          href={`/du-an/${row.original.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-foreground/75 hover:text-foreground hover:underline flex items-center gap-1 w-fit"
        >
          /du-an/{row.original.slug}
          <ArrowSquareOut size={12} />
        </a>
      </div>
    ),
  },

  {
    accessorKey: "projectType.name",
    header: "Loại hình & Sản phẩm lắp đặt",
    cell: ({ row }) => {
      const sType = row.original.projectType;
      const cats = row.original.categories || [];
      if (!sType) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col gap-1.5 max-w-[280px]">
          <span className="font-semibold text-xs text-foreground  w-fit px-2 py-0.5">
            {sType.name}
          </span>
          {cats.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {cats.map((c) => (
                <span
                  key={`${c.id}-${c.condition}`}
                  className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                >
                  <span
                    className={
                      c.condition === "new"
                        ? "text-green-700 font-semibold"
                        : "text-amber-700 font-semibold"
                    }
                  >
                    {c.condition === "new" ? "Mới" : "Cũ"}
                  </span>
                  : {c.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Chưa chọn sản phẩm
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "services",
    header: "Dịch vụ liên quan",
    cell: ({ row }) => {
      const services = row.original.services || [];
      if (services.length === 0)
        return (
          <span className="text-[10px] text-muted-foreground italic">
            Không có
          </span>
        );

      // Nhóm các dịch vụ theo nhóm dịch vụ
      const groups = services.reduce(
        (acc, service) => {
          const groupName = service.group?.name || "Khác";
          if (!acc[groupName]) {
            acc[groupName] = [];
          }
          acc[groupName].push(service);
          return acc;
        },
        {} as Record<string, typeof services>,
      );

      return (
        <div className="flex flex-col gap-3 max-w-[280px]">
          {Object.entries(groups).map(([groupName, groupServices]) => (
            <div key={groupName} className="flex flex-col gap-1.5">
              <span className="font-semibold text-xs text-foreground w-fit px-2 py-0.5">
                {groupName}
              </span>
              <div className="flex flex-wrap gap-1">
                {groupServices.map((service) => (
                  <span
                    key={service.id}
                    className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                  >
                    {service.title}
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
      <Badge variant={row.original.isFeatured ? "secondary" : "outline"}>
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
    accessorKey: "orderIndex",
    header: "Thứ tự",
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const project = row.original;
      return (
        <ButtonGroup>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(project)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <PencilSimple size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(project.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
