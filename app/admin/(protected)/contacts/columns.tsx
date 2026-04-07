"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  Link,
} from "lucide-react";

export type ContactRow = {
  id: string;
  type: string;
  label: string;
  value: string;
  order_index: number;
};

const CONTACT_TYPES = [
  { value: "phone", label: "Điện thoại", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "facebook", label: "Facebook", icon: Globe },
  { value: "zalo", label: "Zalo", icon: MessageCircle },
  { value: "website", label: "Website", icon: Link },
];

function getIcon(type: string) {
  const found = CONTACT_TYPES.find((t) => t.value === type);
  const Icon = found ? found.icon : Globe;
  return <Icon size={14} className="text-muted-foreground mr-2 shrink-0" />;
}

interface ColumnProps {
  onEdit: (contact: ContactRow) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<ContactRow>[] => [
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const type = row.original.type;
      const label = CONTACT_TYPES.find((t) => t.value === type)?.label || type;
      return (
        <div className="flex items-center text-sm font-semibold tracking-tight">
          {getIcon(type)}
          <span className="capitalize">{label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "label",
    header: "Nhãn",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground/70">
        {row.original.label || "—"}
      </span>
    ),
  },
  {
    accessorKey: "value",
    header: "Giá trị",
    cell: ({ row }) => (
      <span className="text-xs font-medium font-mono text-primary/80">
        {row.original.value}
      </span>
    ),
  },
  {
    accessorKey: "order_index",
    header: "Thứ tự",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground/50 font-medium">
        {row.original.order_index}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const contact = row.original;
      return (
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => onEdit(contact)}>
            <Pencil size={16} />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={() => onDelete(contact.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      );
    },
  },
];
