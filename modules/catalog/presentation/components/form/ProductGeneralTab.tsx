"use client";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Category } from "@/modules/category/domain/types";
import { Brand } from "@/modules/catalog/domain/types";
import { ProductFormValues } from "../../hooks/useProductForm";
import { formatPrice } from "@/shared/lib/utils";

interface ProductGeneralTabProps {
  form: UseFormReturn<ProductFormValues>;
  categories: Category[];
  brands: Brand[];
  updateAutoSlug: (name: string, sku: string, catId: string, brdId: string, specs: any[]) => void;
}

export function ProductGeneralTab({
  form,
  categories,
  brands,
  updateAutoSlug,
}: ProductGeneralTabProps) {
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
                      form.getValues("sku"),
                      form.getValues("categoryId"),
                      form.getValues("brandId"),
                      form.getValues("specs")
                    );
                  }}
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
                    updateAutoSlug(
                      form.getValues("name"),
                      e.target.value,
                      form.getValues("categoryId"),
                      form.getValues("brandId"),
                      form.getValues("specs")
                    );
                  }}
                />
                <FieldError errors={[fieldState.error]} />
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
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Danh mục</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    updateAutoSlug(
                      form.getValues("name"),
                      form.getValues("sku"),
                      val,
                      form.getValues("brandId"),
                      form.getValues("specs")
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => !c.parentId)
                      .map((parent) => (
                        <SelectGroup key={parent.id}>
                          <SelectLabel className="opacity-50">
                            {parent.name}
                          </SelectLabel>
                          {categories
                            .filter((c) => c.parentId === parent.id)
                            .map((child) => (
                              <SelectItem key={child.id} value={child.id}>
                                {child.name}
                              </SelectItem>
                            ))}
                          <SelectSeparator />
                        </SelectGroup>
                      ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
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
                    updateAutoSlug(
                      form.getValues("name"),
                      form.getValues("sku"),
                      form.getValues("categoryId"),
                      val,
                      form.getValues("specs")
                    );
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
            name="mpn"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>MPN (Mã linh kiện)</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="VD: MPN-123"
                />
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
            name="slug"
            render={({ field, fieldState }) => {
              const catId = form.watch("categoryId");
              const brdId = form.watch("brandId");
              const catSlug = categories.find((c) => c.id === catId)?.slug || "all";
              const brdSlug = brands.find((b) => b.id === brdId)?.slug || "all";
              const fullUrl = `/san-pham/${catSlug}/${brdSlug}/${field.value}`;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FieldSet>
          <FieldLegend>Giá bán</FieldLegend>
          <FieldGroup className="gap-5">
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
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Cấu hình hiển thị</FieldLegend>
          <FieldGroup className="gap-5">
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
                </Field>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
              <Controller
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <Field
                    orientation="horizontal"
                    className="justify-between border p-3 rounded-lg"
                  >
                    <FieldLabel className="font-normal">
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
                    <FieldLabel className="font-normal">
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
          </FieldGroup>
        </FieldSet>
      </div>
    </FieldGroup>
  );
}
