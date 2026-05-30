"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { formatPrice } from "@/modules/catalog/domain";
import { Badge } from "@/shared/components/ui/badge";
import { Slider } from "@/shared/components/ui/slider";

interface ProductPriceFilterProps {
  hideLabel?: boolean;
  minPriceLimit?: number;
  maxPriceLimit?: number;
}

export function ProductPriceFilter({
  hideLabel,
  minPriceLimit = 0,
  maxPriceLimit = 100_000_000,
}: ProductPriceFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const rawMin = searchParams.get("minPrice");
  const rawMax = searchParams.get("maxPrice");

  const [priceRange, setPriceRange] = useState<[number, number]>([
    rawMin ? Number(rawMin) : minPriceLimit,
    rawMax ? Number(rawMax) : maxPriceLimit,
  ]);

  // Update internal state when limits change (e.g. when switching categories)
  useEffect(() => {
    setPriceRange([
      rawMin ? Number(rawMin) : minPriceLimit,
      rawMax ? Number(rawMax) : maxPriceLimit,
    ]);
  }, [minPriceLimit, maxPriceLimit, rawMin, rawMax]);

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
    const [min, max] = priceRange;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      
      // If min is default limit, don't set it in URL
      if (min > minPriceLimit) {
        params.set("minPrice", String(min));
      } else {
        params.delete("minPrice");
      }
      
      // If max is default limit, don't set it in URL
      if (max < maxPriceLimit) {
        params.set("maxPrice", String(max));
      } else {
        params.delete("maxPrice");
      }
      
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        router.refresh();
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [priceRange, router, minPriceLimit, maxPriceLimit, pathname]);

  // Price range label shown next to the "Khoảng giá" heading
  const [minP, maxP] = priceRange;
  
  const formatDisplayPrice = (price: number) => {
    if (price === 0) return "0 đ";
    return formatPrice(price);
  };

  const priceLabel =
    minP === minPriceLimit && maxP === maxPriceLimit
      ? null
      : minP === minPriceLimit
        ? `Đến ${formatDisplayPrice(maxP)}`
        : maxP === maxPriceLimit
          ? `Từ ${formatDisplayPrice(minP)}`
          : `${formatDisplayPrice(minP)} – ${formatDisplayPrice(maxP)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        {!hideLabel && <span>Khoảng giá</span>}
        <Badge variant="secondary" className="w-full rounded-sm">
          {priceLabel || "Tất cả mức giá"}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 mx-1">
        <Slider
          min={minPriceLimit}
          max={maxPriceLimit}
          step={100000} // 100k step
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          disabled={isPending}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatDisplayPrice(minPriceLimit)}</span>
          <span>{formatDisplayPrice(maxPriceLimit)}</span>
        </div>
      </div>
    </div>
  );
}
