"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

interface ProductSearchProps {
  categories: Category[];
}

// Slider operates in triệu (millions). 100 = 100,000,000 VND.
const PRICE_MAX = 100;

export function ProductSearch({ categories }: ProductSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Text search state ────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");
  const isFirstRenderText = useRef(true);

  // ── Price slider state [minTrieu, maxTrieu] ──────────────────────────────
  const rawMin = searchParams.get("minPrice");
  const rawMax = searchParams.get("maxPrice");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    rawMin ? Math.round(Number(rawMin) / 1_000_000) : 0,
    rawMax ? Math.round(Number(rawMax) / 1_000_000) : PRICE_MAX,
  ]);
  const isFirstRenderPrice = useRef(true);

  // Keep ref in sync so effects always read latest params without being deps
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  // ── Debounce text search → URL (350ms) ───────────────────────────────────
  useEffect(() => {
    if (isFirstRenderText.current) {
      isFirstRenderText.current = false;
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
      router.push(`?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounce price slider → URL (300ms) ──────────────────────────────────
  // min=0 → no lower bound (delete param), max=PRICE_MAX → no upper bound (delete param)
  useEffect(() => {
    if (isFirstRenderPrice.current) {
      isFirstRenderPrice.current = false;
      return;
    }
    const [min, max] = priceRange;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (min > 0) {
        params.set("minPrice", String(min * 1_000_000));
      } else {
        params.delete("minPrice");
      }
      if (max < PRICE_MAX) {
        params.set("maxPrice", String(max * 1_000_000));
      } else {
        params.delete("maxPrice");
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [priceRange]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCategoryChange(value: string) {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    if (value !== "all") {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  function clearSearch() {
    setInputValue("");
  }

  // Price range label shown next to the "Khoảng giá" heading
  const [minP, maxP] = priceRange;
  const priceLabel =
    minP === 0 && maxP === PRICE_MAX
      ? null
      : minP === 0
        ? `Đến ${maxP} triệu`
        : maxP === PRICE_MAX
          ? `Từ ${minP} triệu`
          : `${minP} – ${maxP} triệu`;

  const currentCategory = searchParams.get("category") ?? "all";
  const parents = categories.filter((c) => !c.parent_id);

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Category + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={currentCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className=" w-full sm:w-52">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent className="bg-cream">
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            <SelectSeparator />
            {parents.map((parent) => {
              const children = categories.filter(
                (c) => c.parent_id === parent.id,
              );
              if (children.length > 0) {
                return (
                  <SelectGroup key={parent.id}>
                    <SelectLabel>{parent.name}</SelectLabel>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.slug}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              }
              return (
                <SelectItem key={parent.id} value={parent.slug}>
                  {parent.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <InputGroup className="flex-1">
          <InputGroupAddon align="inline-start">
            <InputGroupText>
              <Search />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            className="h-full text-sm"
            placeholder="Tìm tên, SKU, thông số (9000 BTU, inverter...)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-sm"
              onClick={clearSearch}
              className={inputValue ? "" : "opacity-0 pointer-events-none"}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Row 2: Price slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground capitalize tracking-tight">
            Khoảng giá
          </span>
          {priceLabel ? (
            <span className="text-sm font-semibold">{priceLabel}</span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Tất cả mức giá
            </span>
          )}
        </div>
        <Slider
          min={0}
          max={PRICE_MAX}
          step={1}
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
        />
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">0 đ</span>
          <span className="text-xs text-muted-foreground">100+ triệu</span>
        </div>
      </div>
    </div>
  );
}
