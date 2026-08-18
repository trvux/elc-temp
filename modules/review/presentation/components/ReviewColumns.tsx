"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Eye } from "@phosphor-icons/react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { StarRating } from "@/shared/components/ui/star-rating";
import { AdminReview } from "../../domain";

interface ColumnProps {
  onView: (review: AdminReview) => void;
}

export const getReviewColumns = ({ onView }: ColumnProps): ColumnDef<AdminReview>[] => [
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
    accessorKey: "reviewerName",
    header: "Họ tên",
    cell: ({ row }) => <span className="font-medium">{row.original.reviewerName}</span>,
  },
  {
    accessorKey: "reviewerPhone",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.reviewerPhone || "—",
  },
  {
    id: "product",
    header: "Sản phẩm được đánh giá",
    cell: ({ row }) => {
      const { productId, productName } = row.original;
      if (!productId || !productName) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      return (
        <Link
          href={`/admin/products/${productId}`}
          className="text-sm text-primary hover:underline line-clamp-1 max-w-55"
        >
          {productName}
        </Link>
      );
    },
  },
  {
    accessorKey: "rating",
    header: "Đánh giá",
    cell: ({ row }) => <StarRating value={row.original.rating} size="sm" />,
  },
  {
    accessorKey: "isPublished",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? "default" : "secondary"}>
        {row.original.isPublished ? "Hiển thị" : "Đã ẩn"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onView(row.original)}
        className="h-8 w-8 text-muted-foreground hover:text-primary"
      >
        <Eye size={14} />
      </Button>
    ),
  },
];
