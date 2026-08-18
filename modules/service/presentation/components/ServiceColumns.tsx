import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { formatCurrency } from "@/shared/lib/format";
import { ColumnDef } from "@tanstack/react-table";
import { Check, PencilSimple, Minus, Star, Trash, X } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { ServiceWithRelations } from "../../domain/types";
import { primaryImageUrl } from "@/shared/lib/image-asset";

interface ServiceColumnsProps {
  onEdit: (service: ServiceWithRelations) => void;
  onDelete: (id: string) => void;
}

export const getServiceColumns = ({
  onEdit,
  onDelete,
}: ServiceColumnsProps): ColumnDef<ServiceWithRelations>[] => [
  {
    accessorKey: "images",
    header: "Ảnh",
    cell: ({ row }) => {
      const image = primaryImageUrl(row.original.images);
      const title = row.original.title;
      return image ? (
        <div className="w-10">
          <Image
            src={image}
            alt={title}
            width={40}
            height={30}
            className="rounded object-cover border bg-muted/20"
          />
        </div>
      ) : (
        <div className="w-10 h-10 bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground/40 text-xs font-bold leading-none text-center px-1 capitalize tracking-tighter">
          N/A
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Tên dịch vụ",
    cell: ({ row }) => {
      const service = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm text-foreground">
            {service.title}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {service.slug}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "group",
    header: "Nhóm / Danh mục",
    cell: ({ row }) => {
      const service = row.original;
      return (
        <div className="flex flex-col gap-1">
          {service.group ? (
            <span className="text-foreground/90 font-medium text-xs w-fit">
              {service.group.name}
            </span>
          ) : (
            <span className="text-muted-foreground italic text-xs">-</span>
          )}
          {service.category && (
            <span className="text-xs text-muted-foreground">
              {service.category.name}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Giá / Hiển thị",
    cell: ({ row }) => {
      const service = row.original;
      if (service.priceDisplayText) {
        return (
          <span className="text-sm font-medium text-foreground">
            {service.priceDisplayText}
          </span>
        );
      }
      if (service.originalPrice !== null) {
        const discount = service.discountPercent;
        const hasDiscount =
          discount !== null && discount !== undefined && discount > 0;
        const salePrice = hasDiscount
          ? service.originalPrice -
            Math.round(service.originalPrice * (discount / 100))
          : service.originalPrice;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-sm text-red-600">
              {formatCurrency(salePrice)}
            </span>
            {hasDiscount ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(service.originalPrice)}
                </span>
                <Badge
                  variant="destructive"
                  className="px-1 py-0 h-4 text-xs leading-none"
                >
                  -{discount}%
                </Badge>
              </div>
            ) : null}
          </div>
        );
      }
      return (
        <span className="text-xs text-muted-foreground italic">
          Chưa thiết lập
        </span>
      );
    },
  },
  {
    accessorKey: "labels",
    header: "Nhãn",
    cell: ({ row }) => {
      const labels = row.original.labels || [];
      if (labels.length === 0)
        return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-wrap gap-1 max-w-38">
          {labels.map((l) => (
            <Badge
              key={l}
              variant="outline"
              className="text-xs px-1.5 py-0.5 font-normal"
            >
              {l}
            </Badge>
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
    accessorKey: "isPublished",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? "secondary" : "outline"}>
        {row.original.isPublished ? (
          <>
            <Check size={12} className="mr-1" />
            <span>Hiện</span>
          </>
        ) : (
          <>
            <X size={12} className="mr-1" />
            <span>Ẩn</span>
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
      const service = row.original;
      return (
        <ButtonGroup>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(service)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <PencilSimple size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(service.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
