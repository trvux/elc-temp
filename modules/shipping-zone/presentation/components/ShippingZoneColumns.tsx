"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PencilSimple, Trash, CheckCircle } from "@phosphor-icons/react";
import { ShippingZone } from "../../domain";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Badge } from "@/shared/components/ui/badge";

interface ShippingZoneColumnsProps {
  onEdit: (zone: ShippingZone) => void;
  onDelete: (id: string) => void;
}

function formatVnd(value: number): string {
  return value === 0 ? "Miễn phí" : `${value.toLocaleString("vi-VN")}đ`;
}

export const getShippingZoneColumns = ({ onEdit, onDelete }: ShippingZoneColumnsProps): ColumnDef<ShippingZone>[] => [
  {
    accessorKey: "name",
    header: "Tên khu vực",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-foreground">{row.original.name}</span>
        {row.original.isDefault && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle size={12} /> Mặc định
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "feeVnd",
    header: "Phí giao",
    cell: ({ row }) => formatVnd(row.original.feeVnd),
  },
  {
    id: "days",
    header: "Thời gian giao",
    cell: ({ row }) => `${row.original.minDays}-${row.original.maxDays} ngày`,
  },
  {
    accessorKey: "provinceCodes",
    header: "Số tỉnh/thành",
    cell: ({ row }) => row.original.provinceCodes.length,
  },
  {
    accessorKey: "wardCodes",
    header: "Phường/xã",
    cell: ({ row }) =>
      row.original.wardCodes.length > 0 ? (
        `${row.original.wardCodes.length} phường/xã`
      ) : (
        <span className="text-muted-foreground">Toàn tỉnh</span>
      ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <ButtonGroup>
        <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)} className="h-8 w-8 text-muted-foreground hover:text-primary">
          <PencilSimple size={14} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(row.original.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash size={14} />
        </Button>
      </ButtonGroup>
    ),
  },
];
