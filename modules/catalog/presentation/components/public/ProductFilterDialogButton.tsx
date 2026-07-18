"use client";

import type { AttributeFacet, BrandFacet, NumberBucket, PriceFacet } from "@/modules/catalog/domain";
import { formatPrice } from "@/modules/catalog/domain";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer";
import { Field, FieldContent, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/shared/components/ui/field";
import { cn } from "@/shared/lib/utils";
import { useFilterTransition } from "@/shared/providers/filter-transition-provider";
import { Funnel } from "@phosphor-icons/react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type RangeStrings = [string, string];

const numberFormatter = new Intl.NumberFormat("vi-VN");

// Turns a NumberBucket into a human label — exact number when the bucket
// represents a single real value (min === max, e.g. "15m" for gas pipe
// length), otherwise a range. The two edge buckets use comparison symbols
// matching their actual (asymmetric) query semantics: the first bucket is
// upper-bound-exclusive (value < max), the last is lower-bound-inclusive
// (value >= min) — see BuildNumberBuckets/BuildPriceBuckets on the Go side.
function bucketLabel(bucket: NumberBucket, index: number, total: number, unit?: string | null, isPrice?: boolean): string {
  const fmt = isPrice ? formatPrice : (n: number) => `${numberFormatter.format(n)}${unit ? ` ${unit}` : ""}`;
  if (bucket.min === bucket.max) return fmt(bucket.min);
  if (index === 0) return `< ${fmt(bucket.max)}`;
  if (index === total - 1) return `≥ ${fmt(bucket.min)}`;
  return `${fmt(bucket.min)} - ${fmt(bucket.max)}`;
}

// Desktop (Dialog) vs mobile+tablet (Drawer) cutover — same `lg` (1024px)
// breakpoint the Project module already uses for its own sidebar/Sheet
// split (see ProjectFilterMobile's `lg:hidden`), not the 768px
// phone-only threshold `useIsMobile` uses for the admin sidebar.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

export interface ProductFilterDialogButtonProps {
  brands: BrandFacet[];
  showBrandFacet?: boolean;
  currentBrandIds?: string[];
  price: PriceFacet;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  attributes: AttributeFacet[];
  currentAttrTokens?: Record<string, string[]>;
  currentAttrRanges?: Record<string, RangeStrings>;
  className?: string;
}

// Nút mở dialog (desktop) / drawer đáy màn hình (mobile + tablet) chọn
// filter/facet — đặt cạnh WishlistDialogButton trên header trang listing.
// Lựa chọn bên trong là DRAFT (không tự áp dụng ngay khi tick) — chỉ khi
// bấm "Xác nhận" mới build lại URL params và refetch, để người dùng chọn
// nhiều tiêu chí một lượt thay vì giật kết quả mỗi lần tick 1 ô.
export function ProductFilterDialogButton({
  brands,
  showBrandFacet = true,
  currentBrandIds = [],
  price,
  currentMinPrice = "",
  currentMaxPrice = "",
  attributes,
  currentAttrTokens = {},
  currentAttrRanges = {},
  className,
}: ProductFilterDialogButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPending, startTransition } = useFilterTransition();
  const isDesktop = useIsDesktop();

  const [open, setOpen] = useState(false);

  // Draft state — only synced from the applied (URL-derived) props when the
  // dialog/drawer opens, not on every render, so editing mid-selection
  // doesn't get clobbered.
  const [draftBrandIds, setDraftBrandIds] = useState<string[]>(currentBrandIds);
  const [draftMinPrice, setDraftMinPrice] = useState(currentMinPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(currentMaxPrice);
  const [draftAttrTokens, setDraftAttrTokens] = useState<Record<string, string[]>>(currentAttrTokens);
  const [draftAttrRanges, setDraftAttrRanges] = useState<Record<string, RangeStrings>>(currentAttrRanges);

  const activeFilterCount =
    (currentBrandIds.length > 0 ? 1 : 0) +
    (currentMinPrice || currentMaxPrice ? 1 : 0) +
    Object.values(currentAttrTokens).filter((v) => v.length > 0).length +
    Object.values(currentAttrRanges).filter(([min, max]) => min || max).length;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setDraftBrandIds(currentBrandIds);
    setDraftMinPrice(currentMinPrice);
    setDraftMaxPrice(currentMaxPrice);
    setDraftAttrTokens(currentAttrTokens);
    setDraftAttrRanges(currentAttrRanges);
  };

  const toggleBrand = (id: string) => {
    setDraftBrandIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  const toggleToken = (code: string, value: string) => {
    setDraftAttrTokens((prev) => {
      const current = prev[code] ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [code]: next };
    });
  };

  const setRange = (code: string, min: string, max: string) => {
    setDraftAttrRanges((prev) => ({ ...prev, [code]: [min, max] }));
  };

  const hasDraftFilter = !!(
    draftBrandIds.length > 0 ||
    draftMinPrice ||
    draftMaxPrice ||
    Object.values(draftAttrTokens).some((v) => v.length > 0) ||
    Object.values(draftAttrRanges).some(([min, max]) => min || max)
  );

  const resetDraft = () => {
    setDraftBrandIds([]);
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftAttrTokens({});
    setDraftAttrRanges({});
  };

  const handleConfirm = () => {
    const sParams = new URLSearchParams(searchParams.toString());
    sParams.delete("page");

    if (draftBrandIds.length > 0) sParams.set("brand_ids", draftBrandIds.join(","));
    else sParams.delete("brand_ids");

    if (draftMinPrice) sParams.set("min_price", draftMinPrice);
    else sParams.delete("min_price");
    if (draftMaxPrice) sParams.set("max_price", draftMaxPrice);
    else sParams.delete("max_price");

    for (const key of [...sParams.keys()]) {
      if (key.startsWith("attr_")) sParams.delete(key);
    }
    for (const [code, values] of Object.entries(draftAttrTokens)) {
      if (values.length > 0) sParams.set(`attr_${code}`, values.join(","));
    }
    for (const [code, [min, max]] of Object.entries(draftAttrRanges)) {
      if (min) sParams.set(`attr_${code}_min`, min);
      if (max) sParams.set(`attr_${code}_max`, max);
    }

    startTransition(() => {
      router.push(`${pathname}?${sParams.toString()}`, { scroll: false });
      router.refresh();
    });
    setOpen(false);
  };

  const triggerButton = (
    <Button type="button" variant="outline" size="sm" className={cn(className)}>
      <Funnel data-icon="inline-start" />
      Lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
    </Button>
  );

  // Group attributes by AttributeDefinition.groupLabel (e.g. "Dàn lạnh" vs
  // "Dàn nóng") — several attributes share the same bare `name` (e.g.
  // "Trọng lượng" appears once per group), so the group heading is what
  // actually disambiguates them, not a per-attribute accordion row. Falls
  // back to a single "Thông số khác" bucket for ungrouped attributes.
  const attributeGroups: { label: string; attrs: AttributeFacet[] }[] = [];
  for (const attr of attributes) {
    const label = attr.groupLabel || "Thông số khác";
    const group = attributeGroups.find((g) => g.label === label);
    if (group) group.attrs.push(attr);
    else attributeGroups.push({ label, attrs: [attr] });
  }

  const renderAttributeField = (attr: AttributeFacet) => (
    <Field key={attr.code} className="gap-2">
      <FieldLabel className="font-normal">
        {attr.name}
        {attr.unit ? ` (${attr.unit})` : ""}
      </FieldLabel>
      <FieldContent>
        {attr.dataType === "number" ? (
          <div className="flex flex-wrap gap-2">
            {(attr.buckets ?? []).map((bucket, i, all) => {
              const [curMin, curMax] = draftAttrRanges[attr.code] ?? ["", ""];
              const isActive = Number(curMin) === bucket.min && Number(curMax) === bucket.max;
              return (
                <button
                  type="button"
                  key={`${bucket.min}-${bucket.max}`}
                  onClick={() => setRange(attr.code, isActive ? "" : String(bucket.min), isActive ? "" : String(bucket.max))}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm cursor-pointer transition-colors",
                    isActive ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50",
                  )}
                >
                  {bucketLabel(bucket, i, all.length, attr.unit)}
                  <span className="text-xs text-muted-foreground">{bucket.count}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(attr.dataType === "boolean"
              ? [
                  { value: "true", label: "Có", count: attr.options.find((o) => o.value === "true")?.count ?? 0 },
                  { value: "false", label: "Không", count: attr.options.find((o) => o.value === "false")?.count ?? 0 },
                ]
              : attr.options.map((o) => ({ value: o.value, label: o.value, count: o.count }))
            ).map((opt) => {
              if (opt.count <= 0) return null;
              const isActive = (draftAttrTokens[attr.code] ?? []).includes(opt.value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  aria-pressed={isActive}
                  onClick={() => toggleToken(attr.code, opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm cursor-pointer transition-colors",
                    isActive ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50",
                  )}
                >
                  {opt.label}
                  <span className="text-xs text-muted-foreground">{opt.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </FieldContent>
    </Field>
  );

  const filterBody = (
    <FieldGroup className="gap-4">
      {price.buckets.length > 0 && (
        <FieldSet className="gap-2">
          <FieldLegend variant="label">Khoảng giá</FieldLegend>
          <div className="flex flex-wrap gap-2">
            {price.buckets.map((bucket, i, all) => {
              const isActive = Number(draftMinPrice) === bucket.min && Number(draftMaxPrice) === bucket.max;
              return (
                <button
                  type="button"
                  key={`${bucket.min}-${bucket.max}`}
                  onClick={() => {
                    setDraftMinPrice(isActive ? "" : String(bucket.min));
                    setDraftMaxPrice(isActive ? "" : String(bucket.max));
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm cursor-pointer transition-colors",
                    isActive ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50",
                  )}
                >
                  {bucketLabel(bucket, i, all.length, null, true)}
                  <span className="text-xs text-muted-foreground">{bucket.count}</span>
                </button>
              );
            })}
          </div>
        </FieldSet>
      )}

      {showBrandFacet && brands.length > 0 && (
        <FieldSet className="gap-2">
          <FieldLegend variant="label">Thương hiệu</FieldLegend>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => {
              if (b.count <= 0) return null;
              const isActive = draftBrandIds.includes(b.id);
              return (
                <Button
                  key={b.id}
                  type="button"
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => toggleBrand(b.id)}
                  className={cn("gap-1.5 border", isActive ? "border-primary" : "border-border")}
                >
                  {b.logoUrl && (
                    <Image src={b.logoUrl} alt={b.name} width={20} height={20} className="size-5 object-contain" />
                  )}
                  {b.name}
                  <span className="text-xs text-muted-foreground">{b.count}</span>
                </Button>
              );
            })}
          </div>
        </FieldSet>
      )}

      {attributeGroups.length > 0 && (
        <Accordion type="multiple" defaultValue={attributeGroups.map((g) => g.label)} className="w-full">
          {attributeGroups.map((group) => (
            <AccordionItem key={group.label} value={group.label}>
              <AccordionTrigger className="hover:no-underline text-base font-medium">{group.label}</AccordionTrigger>
              <AccordionContent className="px-1 h-auto!">
                <FieldGroup className="gap-4">
                  {group.attrs.map(renderAttributeField)}
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </FieldGroup>
  );

  // flex-1 on both buttons -> even 50/50 split, footer sits outside the
  // scrollable body (own flex row below) so it stays fixed at the bottom
  // instead of scrolling away with the filter list.
  const footerButtons = (
    <>
      <Button type="button" variant="ghost" onClick={resetDraft} disabled={!hasDraftFilter} className="flex-1">
        Xóa tất cả
      </Button>
      <Button type="button" onClick={handleConfirm} disabled={isPending} className="flex-1">
        Xác nhận
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 p-6 pb-4">
            <DialogTitle>Lọc sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6">{filterBody}</div>
          <DialogFooter className="shrink-0 flex-row gap-2 border-t p-6 pt-4 sm:justify-between">{footerButtons}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="shrink-0">
          <DrawerTitle>Lọc sản phẩm</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4">{filterBody}</div>
        <DrawerFooter className="shrink-0 flex-row gap-2 border-t">{footerButtons}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
