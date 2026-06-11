"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Contact, CONTACT_TYPES } from "../../domain";

interface ColumnProps {
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export const getContactColumns = ({
  onEdit,
  onDelete,
}: ColumnProps): ColumnDef<Contact>[] => [
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const type = CONTACT_TYPES.find((t) => t.value === row.original.type);
      return (
        <span>
          {type?.label || row.original.type}
        </span>
      );
    },
  },
  {
    accessorKey: "label",
    header: "Nhãn",
    cell: ({ row }) => (
      <span>
        {row.original.label || "-"}
      </span>
    ),
  },
  {
    accessorKey: "value",
    header: "Giá trị",
    cell: ({ row }) => (
      <span>
        {row.original.value}
      </span>
    ),
  },
  {
    accessorKey: "orderIndex",
    header: "Thứ tự",
    cell: ({ row }) => (
      <span>
        {row.original.orderIndex}
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Đang bật" : "Đã tắt"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const contact = row.original;
      return (
        <ButtonGroup>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(contact)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <PencilSimple size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(contact.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
