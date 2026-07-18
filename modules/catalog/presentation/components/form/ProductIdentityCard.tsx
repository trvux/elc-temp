"use client";

import { useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { MagicWand } from "@phosphor-icons/react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Brand, formatPrice, VARIANT_STOCK_STATUS, VARIANT_STOCK_STATUS_MAP } from "@/modules/catalog/domain";
import { CategoryWithGroup } from "@/modules/category/domain/types";
import { ProductLine } from "@/modules/product-line/domain";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductIdentityCardProps {
  form: UseFormReturn<ProductFormValues>;
  categories: CategoryWithGroup[];
  brands: Brand[];
  productLines: ProductLine[];
  updateAutoSlug: (name: string) => void;
  regenerateSlug: () => void;
  // Whether this product has ever had a public URL (status published or
  // archived — archived keeps its URL alive for existing backlinks/SEO, see
  // domain.Product.Archive) — regenerating the slug on one of these needs
  // confirmation since it could break an existing link; a draft/proposed
  // product was never public, so it's safe to regenerate without asking.
  isLiveOrWasLive: boolean;
}

export function ProductIdentityCard({
  form,
  categories,
  brands,
  productLines,
  updateAutoSlug,
  regenerateSlug,
  isLiveOrWasLive,
}: ProductIdentityCardProps) {
  const currentCategoryId = form.watch("categoryId");
  const currentBrandId = form.watch("brandId");
  // Every product always has >=1 variant (see the Product doc comment in
  // domain/types.ts) — variants[0] is the implicit default variant, and its
  // sku/mpn/gtin/price/stock fields are what the "flat" Controllers below
  // actually bind to (variants.0.*), not top-level product fields. Once the
  // admin adds a real option (see ProductVariantsTab.tsx), variants.length
  // grows past 1 and this card switches to "managed in Variants card" — same
  // UX as before, just re-plumbed to write into the variant tree instead of
  // fields Product itself no longer has.
  const isMultiVariant = (form.watch("variants")?.length ?? 0) > 1;

  const [confirmComposeOpen, setConfirmComposeOpen] = useState(false);
  const [confirmSlugOpen, setConfirmSlugOpen] = useState(false);

  const composeFromFields = () => {
    const category = categories.find((c) => c.id === currentCategoryId);
    const brand = brands.find((b) => b.id === currentBrandId);
    const productLine = productLines.find((pl) => pl.id === form.getValues("productLineId"));
    const lineName = productLine?.name.replace(/^Dòng\s+/i, "");
    const composed = [category?.name, brand?.name, lineName].filter(Boolean).join(" ");
    if (!composed) return;
    form.setValue("name", composed);
    updateAutoSlug(composed);
  };

  const scrollToVariants = () => {
    document.getElementById("product-variants-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field className="md:col-span-2">
            <div className="flex items-center justify-between">
              <FieldLabel>Tên sản phẩm *</FieldLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                disabled={!currentCategoryId && !currentBrandId}
                onClick={() => (field.value?.trim() ? setConfirmComposeOpen(true) : composeFromFields())}
              >
                <MagicWand size={14} className="mr-1" />
                Ghép tên từ Danh mục/Thương hiệu/Dòng
              </Button>
            </div>
            <Input
              {...field}
              placeholder="VD: Máy lạnh treo tường Daikin Inverter Cao Cấp"
              onChange={(e) => {
                field.onChange(e);
                updateAutoSlug(e.target.value);
              }}
            />
            <FieldDescription>
              Ghép tự động chỉ là gợi ý ban đầu — nhớ thêm công suất/MPN vào tên (VD: &quot;Máy lạnh Daikin Inverter 1HP FTKB25ZVMV&quot;), có thể sửa lại tự do.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <AlertDialog open={confirmComposeOpen} onOpenChange={setConfirmComposeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thay thế tên sản phẩm đang nhập?</AlertDialogTitle>
            <AlertDialogDescription>
              Tên hiện tại sẽ bị ghi đè bằng tên ghép từ Danh mục/Thương hiệu/Dòng sản phẩm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={composeFromFields}>Thay thế</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isMultiVariant ? (
        <Field className="md:col-span-2 border p-4 rounded-lg bg-muted/10">
          <FieldDescription>
            Sản phẩm này đã có biến thể — SKU/MPN/GTIN/giá/tồn kho được quản lý ở{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={scrollToVariants}
            >
              thẻ &quot;Tùy chọn &amp; Biến thể&quot; bên dưới
            </button>
            , không sửa ở đây nữa.
          </FieldDescription>
        </Field>
      ) : (
        <>
          <Controller
            control={form.control}
            name="variants.0.mpn"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>MPN (Mã nhà sản xuất) *</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="VD: FTKC35UAVMV"
                />
                <FieldDescription>
                  Mã nhà sản xuất — đây là mã khách hàng thực sự Google tìm kiếm, không phải SKU nội bộ.
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="variants.0.sku"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Mã sản phẩm (SKU)</FieldLabel>
                <Input {...field} value={field.value ?? ""} placeholder="VD: DAIKIN-15HP" />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="variants.0.gtin"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>GTIN (Barcode/EAN)</FieldLabel>
                <Input {...field} value={field.value ?? ""} placeholder="VD: 8931234567890" />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="variants.0.stockStatus"
            render={({ field }) => (
              <Field>
                <FieldLabel>Trạng thái kho</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VARIANT_STOCK_STATUS).map((status) => (
                      <SelectItem key={status} value={status}>
                        {VARIANT_STOCK_STATUS_MAP[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="variants.0.originalPrice"
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
                    const discount = form.getValues("variants.0.discountPercent") || 0;
                    form.setValue("variants.0.salePrice", Math.round(val * (1 - discount / 100)));
                  }}
                />
                <FieldDescription>{formatPrice(field.value)}</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="variants.0.salePrice"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Giá bán</FieldLabel>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    field.onChange(val);
                    const original = form.getValues("variants.0.originalPrice") || 0;
                    if (original > 0) {
                      form.setValue("variants.0.discountPercent", Math.round(((original - val) / original) * 100));
                    }
                  }}
                />
                <FieldDescription>
                  {formatPrice(field.value || form.getValues("variants.0.originalPrice"))}
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="variants.0.discountPercent"
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
                    const original = form.getValues("variants.0.originalPrice") || 0;
                    form.setValue("variants.0.salePrice", Math.round(original * (1 - val / 100)));
                  }}
                />
                <FieldDescription>Tỷ lệ phần trăm giảm giá</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </>
      )}

      <Controller
        control={form.control}
        name="slug"
        render={({ field, fieldState }) => (
          <Field className="md:col-span-2">
            <div className="flex items-center justify-between">
              <FieldLabel>Slug &amp; URL Preview</FieldLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={() => (isLiveOrWasLive ? setConfirmSlugOpen(true) : regenerateSlug())}
              >
                Tạo lại slug từ tên
              </Button>
            </div>
            <Input {...field} />
            <FieldDescription>URL: /san-pham/{field.value}</FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <AlertDialog open={confirmSlugOpen} onOpenChange={setConfirmSlugOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đổi slug sản phẩm đang hiển thị?</AlertDialogTitle>
            <AlertDialogDescription>
              Sản phẩm này đang ở trạng thái hiển thị công khai — đổi slug sẽ thay đổi URL, liên kết cũ (đã chia sẻ,
              đã lên Google) sẽ không còn hoạt động. Tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                regenerateSlug();
                setConfirmSlugOpen(false);
              }}
            >
              Đổi slug
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FieldGroup>
  );
}
