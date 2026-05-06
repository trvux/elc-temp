"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/shared/components/ui/input-group";

export function ProductSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");
  const isFirstRender = useRef(true);
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (inputValue.trim()) {
        params.set("q", inputValue.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [inputValue, router]);

  function clearSearch() {
    setInputValue("");
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <Search />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          className="h-full text-sm"
          placeholder="Tìm sản phẩm"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            onClick={clearSearch}
            className={inputValue ? "" : "opacity-0 pointer-events-none"}
            aria-label="Xóa tìm kiếm"
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
