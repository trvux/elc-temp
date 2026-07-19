"use client";

import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Input } from "@/shared/components/ui/input";
import { useFilterTransition } from "@/shared/providers/filter-transition-provider";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ProductSearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startTransition } = useFilterTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const [value, setValue] = useState(currentSearch);

  useEffect(() => {
    setValue(currentSearch);
  }, [currentSearch]);

  const push = (next: string) => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");
    if (next) sParams.set("search", next);
    else sParams.delete("search");
    startTransition(() => {
      router.push(`${pathname}?${sParams.toString()}`, { scroll: false });
      router.refresh();
    });
  };

  const handleSearch = () => push(value);

  return (
    <ButtonGroup className="w-full sm:max-w-sm">
      <Input
        placeholder="Tìm sản phẩm trong danh mục này..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
      />
      <Button type="button" variant="outline" aria-label="Tìm kiếm" onClick={handleSearch}>
        <MagnifyingGlass />
      </Button>
    </ButtonGroup>
  );
}
