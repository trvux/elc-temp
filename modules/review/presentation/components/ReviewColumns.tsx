"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Eye, EyeSlash, Trash } from "@phosphor-icons/react";
import { Review } from "../../domain";
import { StarRating } from "./public/StarRating";

interface ColumnProps {
  onTogglePublished: (review: Review) => void;
  onDelete: (id: string) => void;
}

function sourceLabel(review: Review): string {
  if (review.productId) return "Sản phẩm";
  if (review.serviceId) return "Dịch vụ";
  return "—";
}

export const getReviewColumns = ({ onTogglePublished, onDelete }: ColumnProps): ColumnDef<Review>[] => [
  {
    accessorKey: "createdAt",
    header: "Ngày gửi",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {new Date(row.original.createdAt).toLocaleString("vi-VN")}
      </span>
    ),
  },
  {
    accessorKey: "rating",
    header: "Đánh giá",
    cell: ({ row }) => <StarRating value={row.original.rating} size={14} />,
  },
  {
    accessorKey: "reviewerName",
    header: "Người gửi",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-sm">{row.original.reviewerName}</span>
        {row.original.reviewerPhone && (
          <span className="text-xs text-muted-foreground">{row.original.reviewerPhone}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "comment",
    header: "Nội dung",
    cell: ({ row }) => (
      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">{row.original.comment}</p>
    ),
  },
  {
    id: "source",
    header: "Đối tượng",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{sourceLabel(row.original)}</span>
    ),
  },
  {
    accessorKey: "isPublished",
    header: "Trạng thái",
    cell: ({ row }) =>
      row.original.isPublished ? (
        <Badge variant="secondary">Hiển thị</Badge>
      ) : (
        <Badge variant="destructive">Đã ẩn</Badge>
      ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <ButtonGroup>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePublished(row.original)}
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          title={row.original.isPublished ? "Ẩn đánh giá" : "Hiện đánh giá"}
        >
          {row.original.isPublished ? <EyeSlash size={14} /> : <Eye size={14} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title="Xóa đánh giá"
        >
          <Trash size={14} />
        </Button>
      </ButtonGroup>
    ),
  },
];
