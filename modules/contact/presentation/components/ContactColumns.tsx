"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Pencil, Trash2 } from "lucide-react";
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
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const contact = row.original;
      return (
        <ButtonGroup>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onEdit(contact)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(contact.id)}
          >
            <Trash2 size={14} />
          </Button>
        </ButtonGroup>
      );
    },
  },
];
