"use client";

// Admin-only NodeView for the contentVariable node (see
// tiptap-content-variable.ts) — renders a chip so an author can see at a
// glance that a number is live-computed rather than typed, and a popover
// to pick metric + scope from real group/category/brand lists instead of
// typing a slug by hand (a typo here would silently resolve to nothing at
// render time, falling back to whatever fallbackText was last saved).
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ChartBar, Trash, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getAttributeDefinitionsAction } from "@/modules/attribute-definition/presentation/actions";
import { resolveContentVariablesAction } from "@/shared/lib/content-variables-actions";
import { formatContentVariableValue, type ContentVariableMetric } from "@/shared/lib/content-variables";
import { cn } from "@/shared/lib/utils";

const METRIC_LABELS: Record<ContentVariableMetric, string> = {
  count: "Số lượng sản phẩm",
  priceMin: "Giá thấp nhất",
  priceMax: "Giá cao nhất",
  brandCount: "Số thương hiệu",
  categoryCount: "Số loại lắp đặt / danh mục (chỉ dùng với phạm vi Nhóm)",
};

const NO_BRAND = "__none__";
const NO_ATTRIBUTE = "__none__";

interface Option {
  slug: string;
  name: string;
}

interface AttributeOption {
  code: string;
  name: string;
  values: string[];
}

export function TiptapContentVariableNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [attributes, setAttributes] = useState<AttributeOption[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const metric = (node.attrs.metric as ContentVariableMetric) || "count";
  const groupSlug = (node.attrs.groupSlug as string | null) || "";
  const categorySlug = (node.attrs.categorySlug as string | null) || "";
  const brandSlug = (node.attrs.brandSlug as string | null) || "";
  const attributeCode = (node.attrs.attributeCode as string | null) || "";
  const attributeValue = (node.attrs.attributeValue as string | null) || "";
  const fallbackText = (node.attrs.fallbackText as string | null) || "";
  const scopeType: "group" | "category" = categorySlug ? "category" : "group";

  useEffect(() => {
    if (!open) return;
    getGroupsAction().then(({ data }) => setGroups((data ?? []).map((g) => ({ slug: g.slug, name: g.name }))));
    getCategoriesAction().then(({ data }) => setCategories((data ?? []).map((c) => ({ slug: c.slug, name: c.name }))));
    getBrandsAction().then(({ data }) => setBrands((data ?? []).map((b) => ({ slug: b.slug, name: b.name }))));
    // select/multiselect only — boolean/number attributes aren't
    // token-facetable the same way (see domain.ProductFilter.AttributeTokens).
    getAttributeDefinitionsAction({ includeGlobal: true }).then(({ data }) =>
      setAttributes(
        (data ?? [])
          .filter((a) => a.dataType === "select" || a.dataType === "multiselect")
          .map((a) => ({ code: a.code, name: a.name, values: a.options })),
      ),
    );
  }, [open]);

  // Best-effort live preview of the current scope, saved as fallbackText —
  // the number shown if resolution ever fails at render time (API down,
  // slug later deleted) instead of rendering blank. Not the value the
  // public page actually uses on a successful render (that's always
  // re-resolved fresh — see resolveContentVariablesInDoc).
  async function refreshPreview(nextAttrs: {
    metric: ContentVariableMetric;
    groupSlug: string;
    categorySlug: string;
    brandSlug: string;
    attributeCode: string;
    attributeValue: string;
  }) {
    if (!nextAttrs.groupSlug && !nextAttrs.categorySlug) return;
    setLoadingPreview(true);
    try {
      const values = await resolveContentVariablesAction([
        {
          id: "preview",
          metric: nextAttrs.metric,
          filter: {
            groupSlug: nextAttrs.groupSlug || undefined,
            categorySlug: nextAttrs.categorySlug || undefined,
            brandSlug: nextAttrs.brandSlug || undefined,
            attributeCode: nextAttrs.attributeCode || undefined,
            attributeValue: nextAttrs.attributeValue || undefined,
          },
        },
      ]);
      const text = formatContentVariableValue(nextAttrs.metric, values.preview);
      updateAttributes({ ...nextAttrs, fallbackText: text || fallbackText });
    } finally {
      setLoadingPreview(false);
    }
  }

  function setAttrs(
    partial: Partial<{
      metric: ContentVariableMetric;
      groupSlug: string;
      categorySlug: string;
      brandSlug: string;
      attributeCode: string;
      attributeValue: string;
    }>,
  ) {
    const next = {
      metric,
      groupSlug,
      categorySlug,
      brandSlug,
      attributeCode,
      attributeValue,
      ...partial,
    };
    // Attribute filter only applies to metric "count" — clear it when
    // switching to any other metric so a stale attribute scope can't
    // silently keep narrowing a priceMin/brandCount/categoryCount result.
    if (next.metric !== "count") {
      next.attributeCode = "";
      next.attributeValue = "";
    }
    updateAttributes(next);
    void refreshPreview(next);
  }

  const scopeLabel = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.name || categorySlug
    : groups.find((g) => g.slug === groupSlug)?.name || groupSlug || "Chưa chọn phạm vi";
  const brandLabel = brandSlug ? brands.find((b) => b.slug === brandSlug)?.name || brandSlug : null;
  const selectedAttribute = attributes.find((a) => a.code === attributeCode) || null;

  return (
    <NodeViewWrapper as="span" className="inline-block">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-sm font-medium align-baseline",
              "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15",
              selected && "ring-2 ring-primary/40",
            )}
          >
            <ChartBar className="size-3.5" weight="bold" />
            {fallbackText || "…"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 space-y-3" align="start">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Biến động (số liệu sống)</p>
            <Button type="button" variant="ghost" size="icon" className="size-6" onClick={() => setOpen(false)}>
              <X className="size-3.5" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Số liệu</p>
            <Select value={metric} onValueChange={(v) => setAttrs({ metric: v as ContentVariableMetric })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METRIC_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Phạm vi</p>
            <Select
              value={scopeType}
              onValueChange={(v) =>
                v === "group"
                  ? setAttrs({ groupSlug: groupSlug || groups[0]?.slug || "", categorySlug: "" })
                  : setAttrs({ categorySlug: categorySlug || categories[0]?.slug || "", groupSlug: "" })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">Nhóm ngành hàng</SelectItem>
                <SelectItem value="category">Danh mục (loại lắp đặt)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              {scopeType === "group" ? "Nhóm" : "Danh mục"}
            </p>
            <Select
              value={scopeType === "group" ? groupSlug : categorySlug}
              onValueChange={(v) => (scopeType === "group" ? setAttrs({ groupSlug: v }) : setAttrs({ categorySlug: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn...">{scopeLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(scopeType === "group" ? groups : categories).map((opt) => (
                  <SelectItem key={opt.slug} value={opt.slug}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Thương hiệu (không bắt buộc)</p>
            <Select value={brandSlug || NO_BRAND} onValueChange={(v) => setAttrs({ brandSlug: v === NO_BRAND ? "" : v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tất cả thương hiệu">{brandLabel ?? "Tất cả thương hiệu"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BRAND}>Tất cả thương hiệu</SelectItem>
                {brands.map((opt) => (
                  <SelectItem key={opt.slug} value={opt.slug}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {metric === "count" && (
            <div className="space-y-1.5 border-t pt-3">
              <p className="text-xs text-muted-foreground">Lọc thêm theo thuộc tính (không bắt buộc)</p>
              <Select
                value={attributeCode || NO_ATTRIBUTE}
                onValueChange={(v) => setAttrs({ attributeCode: v === NO_ATTRIBUTE ? "" : v, attributeValue: "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Không lọc">{selectedAttribute?.name ?? "Không lọc"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ATTRIBUTE}>Không lọc</SelectItem>
                  {attributes.map((attr) => (
                    <SelectItem key={attr.code} value={attr.code}>
                      {attr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAttribute && (
                <Select value={attributeValue} onValueChange={(v) => setAttrs({ attributeValue: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn giá trị...">{attributeValue || "Chọn giá trị..."}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {selectedAttribute.values.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {loadingPreview ? "Đang tính số liệu..." : fallbackText ? `Hiện tại: ${fallbackText}` : "Chưa có số liệu"}
          </p>

          <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => deleteNode()}>
            <Trash className="size-3.5" />
            Xoá biến động
          </Button>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}
