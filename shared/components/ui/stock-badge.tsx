"use client";

import {
  STOCK_STATUS,
  STOCK_STATUS_MAP,
} from "@/modules/catalog/domain/constants";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { Archive, BellSimple, Check, X } from "@phosphor-icons/react";

interface StockBadgeProps {
  status?: string;
  className?: string;
}

export function StockBadge({ status, className }: StockBadgeProps) {
  if (!status || !STOCK_STATUS_MAP[status]) return null;

  return (
    <Badge
      className={cn(
        "w-fit",
        {
          "bg-green-50 text-green-700 hover:bg-green-50/80 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-950/80":
            status === STOCK_STATUS.IN_STOCK,
          "bg-red-50 text-red-700 hover:bg-red-50/80 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-950/80":
            status === STOCK_STATUS.OUT_OF_STOCK,
          "bg-orange-50 text-orange-700 hover:bg-orange-50/80 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-950/80":
            status === STOCK_STATUS.PRE_ORDER,
          "bg-gray-50 text-gray-700 hover:bg-gray-50/80 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-950/80":
            status === STOCK_STATUS.DISCONTINUED,
        },
        className,
      )}
    >
      {status === STOCK_STATUS.IN_STOCK && (
        <Check weight="bold" data-icon="inline-start" className="w-3 h-3" />
      )}
      {status === STOCK_STATUS.OUT_OF_STOCK && (
        <X weight="bold" data-icon="inline-start" className="w-3 h-3" />
      )}
      {status === STOCK_STATUS.PRE_ORDER && (
        <BellSimple
          weight="bold"
          data-icon="inline-start"
          className="w-3 h-3"
        />
      )}
      {status === STOCK_STATUS.DISCONTINUED && (
        <Archive weight="bold" data-icon="inline-start" className="w-3 h-3" />
      )}
      <span>{STOCK_STATUS_MAP[status]}</span>
    </Badge>
  );
}
