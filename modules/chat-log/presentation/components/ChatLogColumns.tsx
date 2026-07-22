"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { CHAT_LOG_KINDS, ChatLogEntry, ChatLogKind } from "../../domain";

const KIND_BADGE_VARIANT: Record<ChatLogKind, "default" | "secondary" | "destructive" | "outline"> = {
  search: "outline",
  compare: "secondary",
  rank: "secondary",
  purchase_intent: "default",
  off_topic: "destructive",
  no_context_compare: "outline",
};

export const chatLogColumns: ColumnDef<ChatLogEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "Thời gian",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {new Date(row.original.createdAt).toLocaleString("vi-VN")}
      </span>
    ),
  },
  {
    accessorKey: "message",
    header: "Nội dung khách nhập",
    cell: ({ row }) => <span className="text-sm">{row.original.message}</span>,
  },
  {
    accessorKey: "kind",
    header: "Loại",
    cell: ({ row }) => {
      const kind = row.original.kind;
      const label = CHAT_LOG_KINDS.find((k) => k.value === kind)?.label ?? kind;
      return <Badge variant={KIND_BADGE_VARIANT[kind] ?? "outline"}>{label}</Badge>;
    },
  },
  {
    accessorKey: "visitorId",
    header: "Phiên khách",
    // Truncated — this is the anonymous visitor_id cookie value (see
    // elc-go's EnsureVisitorID), useful for grouping messages from the
    // same session, not something staff need to read in full.
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.visitorId.slice(0, 8)}</span>
    ),
  },
];
