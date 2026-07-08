"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Tag } from "../../domain";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";

interface TagColumnsProps {
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
}

export const getTagColumns = ({
  onEdit,
  onDelete,
}: TagColumnsProps): ColumnDef<Tag>[] => [
  {
    accessorKey: "name",
    header: "Tên thẻ",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-sm text-foreground">{row.original.name}</span>
        <span className="text-[11px] text-foreground/75">/{row.original.slug}</span>
      </div>
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
          onClick={() => onEdit(row.original)}
          className="h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <PencilSimple size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash size={14} />
        </Button>
      </ButtonGroup>
    ),
  },
];
