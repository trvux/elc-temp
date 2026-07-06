"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Eye } from "@phosphor-icons/react";
import { INQUIRY_STATUSES, Inquiry, InquiryStatus } from "../../domain";

interface ColumnProps {
  onView: (inquiry: Inquiry) => void;
}

const STATUS_BADGE_VARIANT: Record<InquiryStatus, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  contacted: "secondary",
  converted: "outline",
  closed: "destructive",
};

function sourceLabel(inquiry: Inquiry): string {
  if (inquiry.productId) return "Sản phẩm";
  if (inquiry.projectId) return "Dự án";
  if (inquiry.serviceId) return "Dịch vụ";
  return "Tư vấn chung";
}

export const getInquiryColumns = ({ onView }: ColumnProps): ColumnDef<Inquiry>[] => [
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
    accessorKey: "name",
    header: "Họ tên",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "phone",
    header: "Số điện thoại",
  },
  {
    id: "source",
    header: "Quan tâm",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{sourceLabel(row.original)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status;
      const label = INQUIRY_STATUSES.find((s) => s.value === status)?.label ?? status;
      return <Badge variant={STATUS_BADGE_VARIANT[status]}>{label}</Badge>;
    },
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
