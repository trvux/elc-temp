"use client";

import { useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldError,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Group } from "@/modules/group/domain/types";
import { CategoryWithGroup } from "@/modules/category/domain/types";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Brand, formatPrice, PRODUCT_LABELS, PRODUCT_CONDITION, PRODUCT_CONDITION_MAP } from "@/modules/catalog/domain";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductGeneralTabProps {
  form: UseFormReturn<ProductFormValues>;
  groups: Group[];
  categories: CategoryWithGroup[];
  brands: Brand[];
  updateAutoSlug: (name: string, mpn: string) => void;
}

export function ProductGeneralTab({
  form,
  groups,
  categories,
  brands,
  updateAutoSlug,
}: ProductGeneralTabProps) {
  const currentCategoryId = form.watch("categoryId");
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
    <FieldGroup className="gap-8">
      <FieldSet>
        <FieldLegend>Thông tin sản phẩm</FieldLegend>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field className="md:col-span-2">
                <FieldLabel>Tên sản phẩm *</FieldLabel>
                <Input
                  {...field}
                  placeholder="VD: Máy lạnh Daikin 1.5HP"
                  onChange={(e) => {
                    field.onChange(e);
                    updateAutoSlug(
                      e.target.value,
                      form.getValues("mpn") || ""
                    );
                  }}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {/* Nhóm danh mục (Cascading Level 1) */}
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

          {/* Danh mục mới (Cascading Level 2) */}
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field, fieldState }) => {
              const filteredCategories = categories.filter(
                (c) => c.groupId === selectedGroupId
              );

              return (
                <Field>
                  <FieldLabel>Danh mục mới *</FieldLabel>
                  <Select
                    value={field.value || "none"}
                    disabled={!selectedGroupId}
                    onValueChange={(val) => {
                      const actualVal = val === "none" ? "" : val;
                      field.onChange(actualVal);
                    }}
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
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                  }}
                >
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

          <Controller
            control={form.control}
            name="gtin"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>GTIN (Barcode/EAN)</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="VD: 8931234567890"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="sku"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Mã sản phẩm (SKU) *</FieldLabel>
                <Input
                  {...field}
                  placeholder="VD: DAIKIN-15HP"
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="mpn"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>MPN (Mã linh kiện)</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="VD: MPN-123"
                  onChange={(e) => {
                    field.onChange(e);
                    updateAutoSlug(
                      form.getValues("name"),
                      e.target.value
                    );
                  }}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="condition"
            render={({ field }) => (
              <Field>
                <FieldLabel>Tình trạng sản phẩm</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PRODUCT_CONDITION.NEW}>
                      {PRODUCT_CONDITION_MAP[PRODUCT_CONDITION.NEW]}
                    </SelectItem>
                    <SelectItem value={PRODUCT_CONDITION.USED}>
                      {PRODUCT_CONDITION_MAP[PRODUCT_CONDITION.USED]}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="stockStatus"
            render={({ field }) => (
              <Field>
                <FieldLabel>Trạng thái kho</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">Còn hàng</SelectItem>
                    <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                    <SelectItem value="pre_order">Đặt trước</SelectItem>
                    <SelectItem value="discontinued">Ngưng sản xuất</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => {
              const fullUrl = `/san-pham/${field.value}`;

              return (
                <Field className="md:col-span-2">
                  <FieldLabel>Slug & URL Preview</FieldLabel>
                  <Input {...field} />
                  <FieldDescription>URL: {fullUrl}</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              );
            }}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Giá bán</FieldLegend>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller
            control={form.control}
            name="originalPrice"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Giá gốc *</FieldLabel>
                <Input
                  type="number"
                  {...field}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    field.onChange(val);
                    const discount = form.getValues("discountPercent") || 0;
                    form.setValue(
                      "salePrice",
                      Math.round(val * (1 - discount / 100))
                    );
                  }}
                />
                <FieldDescription>{formatPrice(field.value)}</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="salePrice"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Giá bán</FieldLabel>
                <Input
                  type="number"
                  {...field}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    field.onChange(val);
                    const original = form.getValues("originalPrice") || 0;
                    if (original > 0) {
                      form.setValue(
                        "discountPercent",
                        Math.round(((original - val) / original) * 100)
                      );
                    }
                  }}
                />
                <FieldDescription>
                  {formatPrice(field.value || form.getValues("originalPrice"))}
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="discountPercent"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Giảm %</FieldLabel>
                <Input
                  type="number"
                  {...field}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    field.onChange(val);
                    const original = form.getValues("originalPrice") || 0;
                    form.setValue(
                      "salePrice",
                      Math.round(original * (1 - val / 100))
                    );
                  }}
                />
                <FieldDescription>Tỷ lệ phần trăm giảm giá</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Cấu hình hiển thị</FieldLegend>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-5">
            <Controller
              control={form.control}
              name="orderIndex"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Thứ tự hiển thị</FieldLabel>
                  <Input
                    type="number"
                    {...field}
                    onFocus={(e) => e.target.select()}
                  />
                  <FieldDescription>Thứ tự sắp xếp hiển thị của sản phẩm</FieldDescription>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="justify-between border p-3 rounded-lg"
                >
                  <FieldLabel className="font-normal mb-0">
                    Sản phẩm nổi bật
                  </FieldLabel>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="justify-between border p-3 rounded-lg"
                >
                  <FieldLabel className="font-normal mb-0">
                    Trạng thái hiển thị
                  </FieldLabel>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </div>

          <div className="flex flex-col gap-5">
            <Controller
              control={form.control}
              name="labels"
              render={({ field }) => {
                const currentLabels = field.value || [];
                const toggleLabel = (val: string) => {
                  if (currentLabels.includes(val)) {
                    field.onChange(currentLabels.filter((l) => l !== val));
                  } else {
                    field.onChange([...currentLabels, val]);
                  }
                };
                return (
                  <Field className="border p-4 rounded-lg h-full">
                    <FieldLabel className="font-normal">Nhãn hiển thị</FieldLabel>
                    <div className="flex flex-col gap-3.5 mt-3">
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <Checkbox 
                          checked={currentLabels.includes(PRODUCT_LABELS.NEW)} 
                          onCheckedChange={() => toggleLabel(PRODUCT_LABELS.NEW)} 
                        />
                        <span>Mới về (New)</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <Checkbox 
                          checked={currentLabels.includes(PRODUCT_LABELS.HOT)} 
                          onCheckedChange={() => toggleLabel(PRODUCT_LABELS.HOT)} 
                        />
                        <span>Nổi bật (Hot)</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <Checkbox 
                          checked={currentLabels.includes(PRODUCT_LABELS.BEST_SELLER)} 
                          onCheckedChange={() => toggleLabel(PRODUCT_LABELS.BEST_SELLER)} 
                        />
                        <span>Bán chạy (Best Seller)</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <Checkbox 
                          checked={currentLabels.includes(PRODUCT_LABELS.SALE)} 
                          onCheckedChange={() => toggleLabel(PRODUCT_LABELS.SALE)} 
                        />
                        <span>Giảm giá (Sale)</span>
                      </label>
                    </div>
                  </Field>
                );
              }}
            />
          </div>
        </FieldGroup>
      </FieldSet>
      <FieldSeparator />

      {/* SEO Section */}
      <FieldSet>
        <FieldLegend>Cấu hình SEO</FieldLegend>
        <div className="space-y-6 border p-6 rounded-2xl bg-muted/10">
          <div className="border-b pb-2">
            <h3 className="text-sm font-semibold tracking-tight">Tối ưu hóa tìm kiếm</h3>
            <p className="text-[11px] text-muted-foreground">Cấu hình hiển thị sản phẩm trên các công cụ tìm kiếm.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              control={form.control}
              name="metaTitle"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Tiêu đề SEO</FieldLabel>
                  <Input {...field} value={field.value || ""} placeholder="Để trống sẽ tự động dùng tên sản phẩm..." />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="metaDescription"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Mô tả SEO</FieldLabel>
                  <Textarea {...field} value={field.value || ""} placeholder="Mô tả tóm tắt sản phẩm để hiển thị trên Google..." className="min-h-[80px]" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>
        </div>
      </FieldSet>
    </FieldGroup>
  );
}
