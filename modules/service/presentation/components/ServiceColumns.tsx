import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { ColumnDef } from "@tanstack/react-table";
import { Check, PencilSimple, Trash, X } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { ServiceWithRelations } from "../../domain/types";
import { SERVICE_LINES } from "../../domain/line";
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
        <div className="w-10 h-10 bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground/40 type-tag text-center px-1 capitalize">
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
          <span className="type-caption text-foreground">
            {service.title}
          </span>
          <span className="type-mono text-muted-foreground">
            {service.slug}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "line",
    header: "Mảng",
    cell: ({ row }) => (
      <span className="type-tag text-foreground/90 w-fit">
        {SERVICE_LINES[row.original.line].label}
      </span>
    ),
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
              className="type-legal px-1.5 py-0.5"
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
      <span className="type-body-sm">{row.original.orderIndex}</span>
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
        <span className="text-muted-foreground type-body-sm">
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
