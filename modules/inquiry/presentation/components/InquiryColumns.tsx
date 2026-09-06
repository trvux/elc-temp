"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Eye } from "@phosphor-icons/react";
import { computeLeadPriority, INQUIRY_STATUSES, Inquiry, InquiryStatus, LeadType } from "../../domain";

interface ColumnProps {
  onView: (inquiry: Inquiry) => void;
}

const STATUS_BADGE_VARIANT: Record<InquiryStatus, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  contacted: "secondary",
  converted: "outline",
  closed: "destructive",
};

const LEAD_TYPE_LABEL: Record<LeadType, string> = {
  product: "Sản phẩm",
  service: "Dịch vụ",
  project: "Dự án",
  general: "Tư vấn chung",
};

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
    cell: ({ row }) => {
      const inquiry = row.original;
      // subType itself is a slug (e.g. "may-lanh-treo-tuong") — meant for
      // filtering, not display. qualifyData already carries the same pick
      // as a human name (productCategory/serviceGroup/projectType, set
      // alongside subType in LeadFormScreen's select* handlers), so prefer
      // that; only fall back to the raw slug if qualifyData is somehow
      // missing it (a general-branch or pre-picker-conversion lead).
      const subTypeLabel =
        inquiry.qualifyData.productCategory ??
        inquiry.qualifyData.serviceGroup ??
        inquiry.qualifyData.projectType ??
        inquiry.subType;
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">
            {LEAD_TYPE_LABEL[inquiry.leadType]}
            {subTypeLabel ? ` · ${subTypeLabel}` : ""}
          </span>
        </div>
      );
    },
  },
  {
    id: "priority",
    header: "Ưu tiên",
    cell: ({ row }) => {
      const priority = computeLeadPriority(row.original);
      if (!priority) return null;
      return <Badge variant={priority.variant}>{priority.label}</Badge>;
    },
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
