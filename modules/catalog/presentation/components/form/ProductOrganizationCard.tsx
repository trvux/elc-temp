"use client";

import { useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { TagMultiSelect } from "@/shared/components/ui/tag-multi-select";
import { Brand } from "@/modules/catalog/domain";
import { Group } from "@/modules/group/domain/types";
import { CategoryWithGroup } from "@/modules/category/domain/types";
import { ProductLine } from "@/modules/product-line/domain";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductOrganizationCardProps {
  form: UseFormReturn<ProductFormValues>;
  groups: Group[];
  categories: CategoryWithGroup[];
  brands: Brand[];
  productLines: ProductLine[];
}

export function ProductOrganizationCard({
  form,
  groups,
  categories,
  brands,
  productLines,
}: ProductOrganizationCardProps) {
  const currentCategoryId = form.watch("categoryId");
  const currentBrandId = form.watch("brandId");
  const brandProductLines = productLines.filter((pl) => pl.brandId === currentBrandId);

  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    if (currentCategoryId) {
      const cat = categories.find((c) => c.id === currentCategoryId);
      return cat?.groupId || "";
    }
    return "";
  });

  // Sync selected group during render if categoryId changes (e.g. on form reset/load)
  const [prevCategoryId, setPrevCategoryId] = useState(currentCategoryId);
  if (currentCategoryId !== prevCategoryId) {
    setPrevCategoryId(currentCategoryId);
    if (currentCategoryId) {
      const cat = categories.find((c) => c.id === currentCategoryId);
      setSelectedGroupId(cat?.groupId || "");
    } else {
      setSelectedGroupId("");
    }
  }

  return (
    <FieldGroup className="gap-5">
      <Field>
        <FieldLabel>Nhóm danh mục *</FieldLabel>
        <Select
          value={selectedGroupId || "none"}
          onValueChange={(val) => {
            const actualVal = val === "none" ? "" : val;
            setSelectedGroupId(actualVal);
            form.setValue("categoryId", ""); // Reset category when group changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn nhóm danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Không chọn nhóm danh mục</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Controller
        control={form.control}
        name="categoryId"
        render={({ field, fieldState }) => {
          const filteredCategories = categories.filter((c) => c.groupId === selectedGroupId);
          return (
            <Field id="product-category-field">
              <FieldLabel>Danh mục mới *</FieldLabel>
              <Select
                value={field.value || "none"}
                disabled={!selectedGroupId}
                onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedGroupId ? "Chọn danh mục mới" : "Vui lòng chọn nhóm danh mục trước"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn danh mục</SelectItem>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          );
        }}
      />

      <Controller
        control={form.control}
        name="brandId"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Thương hiệu</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn thương hiệu" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Field>
        <FieldLabel>Dòng sản phẩm</FieldLabel>
        <Controller
          control={form.control}
          name="productLineId"
          render={({ field }) => (
            <Select
              value={field.value || "none"}
              disabled={!currentBrandId || brandProductLines.length === 0}
              onValueChange={(val) => field.onChange(val === "none" ? null : val)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !currentBrandId
                      ? "Chọn thương hiệu trước"
                      : brandProductLines.length === 0
                        ? "Thương hiệu này chưa có dòng nào"
                        : "Không thuộc dòng nào"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không thuộc dòng nào</SelectItem>
                {brandProductLines.map((pl) => (
                  <SelectItem key={pl.id} value={pl.id}>
                    {pl.code} — {pl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldDescription>Quản lý ở trang &quot;Dòng sản phẩm&quot; trong sidebar.</FieldDescription>
      </Field>

      <Controller
        control={form.control}
        name="tagIds"
        render={({ field }) => (
          <Field>
            <FieldLabel>Thẻ (Tags)</FieldLabel>
            <TagMultiSelect value={field.value || []} onChange={field.onChange} />
          </Field>
        )}
      />
    </FieldGroup>
  );
}
