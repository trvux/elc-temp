"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/shared/components/ui/input-group";

export function ProjectSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [inputValue, setInputValue] = useState<string>(searchParams.get("search") ?? "");
  const isFirstRender = useRef<boolean>(true);
  const searchParamsRef = useRef<URLSearchParams>(searchParams);

  useEffect(() => {
    searchParamsRef.current = new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  // Synchronize input value with URL search parameter 'search' (e.g. when filters are cleared)
  const qParam = searchParams.get("search") ?? "";
  useEffect(() => {
    setInputValue(qParam);
  }, [qParam]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      const currentQ = params.get("search") ?? "";
      const trimmedValue = inputValue.trim();

      // Avoid redundant routing if the search term hasn't actually changed
      if (trimmedValue === currentQ) return;

      if (trimmedValue) {
        params.set("search", trimmedValue);
      } else {
        params.delete("search");
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        router.refresh();
      });
    }, 500); // 500ms delay to prevent excessive network requests while typing
    return () => clearTimeout(timer);
  }, [inputValue, router, pathname]);

  function clearSearch() {
    setInputValue("");
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">

      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <MagnifyingGlass />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          className="h-full text-sm"
          placeholder="Tìm kiếm dự án"
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
            <X className="text-red-600" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
