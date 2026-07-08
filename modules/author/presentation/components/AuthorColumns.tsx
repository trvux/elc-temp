"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Author } from "../../domain";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";

interface AuthorColumnsProps {
  onEdit: (author: Author) => void;
  onDelete: (id: string) => void;
}

export const getAuthorColumns = ({
  onEdit,
  onDelete,
}: AuthorColumnsProps): ColumnDef<Author>[] => [
  {
    accessorKey: "avatarUrl",
    header: "Ảnh",
    cell: ({ row }) => (
      <div className="w-10 h-10 relative border border-border/40 rounded-full overflow-hidden flex items-center justify-center bg-muted/20">
        {row.original.avatarUrl ? (
          <Image
            src={row.original.avatarUrl}
            alt={row.original.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <span className="text-[10px] text-muted-foreground uppercase font-bold">
            {row.original.name.slice(0, 1)}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Tên tác giả",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-sm text-foreground">{row.original.name}</span>
        <span className="text-[11px] text-foreground/75">/{row.original.slug}</span>
      </div>
    ),
  },
  {
    accessorKey: "bio",
    header: "Tiểu sử",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
        {row.original.bio || "—"}
      </span>
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
