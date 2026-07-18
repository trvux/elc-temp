"use client";

import type { ProductSortBy } from "@/modules/catalog/domain";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useFilterTransition } from "@/shared/providers/filter-transition-provider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS: { value: ProductSortBy | "default"; label: string }[] = [
  { value: "default", label: "Mặc định" },
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

export function ProductSortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startTransition } = useFilterTransition();

  const current = searchParams.get("sort_by") ?? "default";

  const handleChange = (value: string) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");
    if (value === "default") sParams.delete("sort_by");
    else sParams.set("sort_by", value);
    startTransition(() => {
      router.push(`${pathname}?${sParams.toString()}`, { scroll: false });
      router.refresh();
    });
  };

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger
        size="sm"
        className="w-25 gap-1 pr-1.5 pl-2 sm:w-37.5 sm:gap-1.5 sm:pr-2 sm:pl-2.5"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
