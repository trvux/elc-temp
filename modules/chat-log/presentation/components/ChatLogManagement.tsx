"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { CHAT_LOG_KINDS } from "../../domain";
import { getChatLogsAction } from "../actions";
import { chatLogColumns } from "./ChatLogColumns";

// 100 most recent entries, newest first (see getChatLogsAction/elc-go's
// GetAll) — this is a browse/analysis view of real shopper pain-point/
// purchase-intent data (see docs/chat-search-intent-research.md in
// elc-tem, and ProductChatFinder.tsx's logChatMessage), not a paginated
// export; a wider date range needs a proper export tool, not this screen.
const LIST_LIMIT = 100;

export function ChatLogManagement() {
  const [filterKind, setFilterKind] = useState<string>("all");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["chat-logs", filterKind],
    queryFn: async () => {
      const { data, error } = await getChatLogsAction({
        kind: filterKind === "all" ? undefined : filterKind,
        limit: LIST_LIMIT,
      });
      if (error) throw new Error(error);
      return data;
    },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Lịch sử Chat AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Mọi tin nhắn khách nhập vào khung chat tìm sản phẩm — pain point/ý định mua hàng thật, theo đúng lời khách.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select value={filterKind} onValueChange={setFilterKind}>
          <SelectTrigger className="w-full md:w-[260px]">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {CHAT_LOG_KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filterKind !== "all" && (
          <Button
            variant="ghost"
            onClick={() => setFilterKind("all")}
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={chatLogColumns}
        data={entries}
        isLoading={isLoading}
        searchKey="message"
        searchPlaceholder="Tìm theo nội dung khách nhập..."
      />
    </div>
  );
}
