"use client";

import { useState } from "react";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import { Plus, Trash, X } from "@phosphor-icons/react";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/shared/components/ui/field";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { TagInput } from "@/shared/components/ui/tag-input";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatPrice, VARIANT_STOCK_STATUS, VARIANT_STOCK_STATUS_MAP } from "@/modules/catalog/domain";
import { ProductFormValues } from "../../hooks/useProductForm";

type ProductVariantFormValue = NonNullable<ProductFormValues["variants"]>[number];

interface ProductVariantsTabProps {
  form: UseFormReturn<ProductFormValues>;
  optionsFields: FieldArrayWithId<ProductFormValues, "options", "id">[];
  appendOption: (value: { name: string; values: string[] }) => void;
  removeOption: (index: number) => void;
  variantsFields: FieldArrayWithId<ProductFormValues, "variants", "id">[];
  appendVariant: (value: ProductVariantFormValue) => void;
  removeVariant: (index: number) => void;
}

export function ProductVariantsTab({
  form,
  optionsFields,
  appendOption,
  removeOption,
  variantsFields,
  appendVariant,
  removeVariant,
}: ProductVariantsTabProps) {
  const options = form.watch("options") || [];
  const variants = form.watch("variants") || [];
  const defaultIndex = variants.findIndex((v) => v.isDefault);

  const setAllVariants = (updater: (v: ProductVariantFormValue, i: number) => ProductVariantFormValue) => {
    form.setValue("variants", variants.map(updater));
  };

  // Bundle components (dàn nóng/dàn lạnh etc.) only matter for a small
  // minority of products — keep the section collapsed by default so it
  // doesn't compete with the primary MPN/price/stock fields on every card.
  // Pre-expand any variant that already has components (existing data).
  const [bundleExpanded, setBundleExpanded] = useState<Set<number>>(
    () => new Set(variants.map((v, i) => ((v.components?.length ?? 0) > 0 ? i : -1)).filter((i) => i >= 0))
  );
  const toggleBundle = (i: number, checked: boolean) => {
    setBundleExpanded((prev) => {
      const next = new Set(prev);
      if (checked) next.add(i);
      else next.delete(i);
      return next;
    });
    if (!checked) {
      form.setValue(`variants.${i}.components`, []);
    }
  };

  const canGenerateFromOptions = options.some((o) => (o.values || []).length > 0);
  const generateVariantsFromOptions = () => {
    // Cartesian product of every option's values — options with no values
    // yet don't add a dimension, they're just skipped.
    const combos = options.reduce<{ optionName: string; value: string }[][]>(
      (acc, opt) => {
        if (!opt.values || opt.values.length === 0) return acc;
        const next: { optionName: string; value: string }[][] = [];
        for (const combo of acc) {
          for (const val of opt.values) {
            next.push([...combo, { optionName: opt.name, value: val }]);
          }
        }
        return next;
      },
      [[]]
    );

    const comboKey = (sel: { optionName: string; value: string }[]) =>
      [...sel].map((s) => `${s.optionName}:${s.value}`).sort().join("|");
    const existingCombos = new Set(variants.map((v) => comboKey(v.optionSelections || [])));

    let added = 0;
    combos.forEach((combo) => {
      if (existingCombos.has(comboKey(combo))) return;
      appendVariant({
        mpn: "",
        sku: "",
        gtin: "",
        isDefault: variantsFields.length === 0 && added === 0,
        isComponentOnly: false,
        stockStatus: VARIANT_STOCK_STATUS.IN_STOCK,
        leadTimeDays: null,
        originalPrice: 0,
        salePrice: 0,
        discountPercent: 0,
        weight: null,
        isActive: true,
        orderIndex: variantsFields.length + added,
        optionSelections: combo,
        components: [],
      });
      added++;
    });
  };

  return (
    <FieldGroup className="gap-8">
      {/* Options */}
      <FieldSet>
        <div className="flex items-center justify-between">
          <div>
            <FieldLegend>Tùy chọn (Options)</FieldLegend>
            <FieldDescription>
              VD: &quot;Màu sắc&quot; với các giá trị Đỏ/Đen. Mỗi biến thể bên dưới sẽ chọn 1 giá trị cho mỗi tùy chọn.
            </FieldDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendOption({ name: "", values: [] })}
          >
            <Plus size={14} className="mr-2" /> Thêm tùy chọn
          </Button>
        </div>

        <FieldGroup className="gap-4">
          {optionsFields.map((field, i) => (
            <div key={field.id} className="border p-4 rounded-xl bg-muted/5 space-y-4">
              <div className="flex items-start gap-3">
                <Field className="flex-1">
                  <FieldLabel className="text-xs">Tên tùy chọn</FieldLabel>
                  <Input placeholder="VD: Màu sắc" {...form.register(`options.${i}.name`)} />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-5 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeOption(i)}
                >
                  <Trash size={14} />
                </Button>
              </div>
              <Field>
                <FieldLabel className="text-xs">Giá trị</FieldLabel>
                <TagInput
                  values={form.watch(`options.${i}.values`) || []}
                  onChange={(next) => form.setValue(`options.${i}.values`, next)}
                  placeholder="VD: Đỏ, Đen, 256GB..."
                />
              </Field>
            </div>
          ))}
          {optionsFields.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Chưa có tùy chọn nào — sản phẩm chỉ có 1 biến thể mặc định.
            </p>
          )}
        </FieldGroup>
      </FieldSet>

      {/* Variants */}
      <FieldSet className="border-t pt-8">
        <div className="flex items-center justify-between">
          <div>
            <FieldLegend>Biến thể (Variants)</FieldLegend>
            <FieldDescription>
              Mỗi biến thể là 1 đơn vị bán thực tế — có MPN, giá, tồn kho riêng. Đúng 1 biến thể phải là mặc định.
            </FieldDescription>
          </div>
          <div className="flex items-center gap-2">
            {canGenerateFromOptions && (
              <Button type="button" variant="outline" size="sm" onClick={generateVariantsFromOptions}>
                <Plus size={14} className="mr-2" /> Tạo biến thể từ tùy chọn
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendVariant({
                  mpn: "",
                  sku: "",
                  gtin: "",
                  isDefault: variantsFields.length === 0,
                  isComponentOnly: false,
                  stockStatus: VARIANT_STOCK_STATUS.IN_STOCK,
                  leadTimeDays: null,
                  originalPrice: 0,
                  salePrice: 0,
                  discountPercent: 0,
                  weight: null,
                  isActive: true,
                  orderIndex: variantsFields.length,
                  optionSelections: [],
                  components: [],
                })
              }
            >
              <Plus size={14} className="mr-2" /> Thêm biến thể
            </Button>
          </div>
        </div>

        <RadioGroup
          value={defaultIndex >= 0 ? String(defaultIndex) : undefined}
          onValueChange={(val) => setAllVariants((v, i) => ({ ...v, isDefault: i === Number(val) }))}
          className="gap-4"
        >
          {variantsFields.map((field, i) => {
            const variant = variants[i];
            const otherVariants = variantsFields
              .map((f, idx) => ({ id: f.id, idx, mpn: variants[idx]?.mpn }))
              .filter((v) => v.idx !== i);
            const components = variant?.components || [];

            return (
              <div key={field.id} className="border p-4 rounded-xl bg-muted/5 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <RadioGroupItem value={String(i)} />
                    Biến thể mặc định
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeVariant(i)}
                  >
                    <Trash size={14} className="mr-1" /> Xóa biến thể
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel className="text-xs">MPN (mã nhà sản xuất) *</FieldLabel>
                    <Input placeholder="VD: FTKB25ZVMV" {...form.register(`variants.${i}.mpn`)} />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">SKU nội bộ</FieldLabel>
                    <Input placeholder="Để trống sẽ tự tạo" {...form.register(`variants.${i}.sku`)} />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">GTIN (Barcode)</FieldLabel>
                    <Input placeholder="Tùy chọn" {...form.register(`variants.${i}.gtin`)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel className="text-xs">Giá gốc *</FieldLabel>
                    <Input
                      type="number"
                      onFocus={(e) => e.target.select()}
                      {...form.register(`variants.${i}.originalPrice`, { valueAsNumber: true })}
                    />
                    <FieldDescription>{formatPrice(variant?.originalPrice || 0)}</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">Giá bán</FieldLabel>
                    <Input
                      type="number"
                      onFocus={(e) => e.target.select()}
                      {...form.register(`variants.${i}.salePrice`, { valueAsNumber: true })}
                    />
                    <FieldDescription>{formatPrice(variant?.salePrice || variant?.originalPrice || 0)}</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">Trạng thái kho</FieldLabel>
                    <Select
                      value={variant?.stockStatus || VARIANT_STOCK_STATUS.IN_STOCK}
                      onValueChange={(val) => form.setValue(`variants.${i}.stockStatus`, val as ProductVariantFormValue["stockStatus"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(VARIANT_STOCK_STATUS).map((s) => (
                          <SelectItem key={s} value={s}>
                            {VARIANT_STOCK_STATUS_MAP[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={variant?.isActive ?? true}
                      onCheckedChange={(v) => form.setValue(`variants.${i}.isActive`, !!v)}
                    />
                    Đang kinh doanh
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={variant?.isComponentOnly ?? false}
                      onCheckedChange={(v) => form.setValue(`variants.${i}.isComponentOnly`, !!v)}
                    />
                    Chỉ là linh kiện (không bán lẻ riêng, VD: dàn nóng/dàn lạnh)
                  </label>
                </div>

                {options.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    {options.map((opt) => {
                      const selections = variant?.optionSelections || [];
                      const current = selections.find((s) => s.optionName === opt.name)?.value || "";
                      return (
                        <Field key={opt.name}>
                          <FieldLabel className="text-xs">{opt.name || "(chưa đặt tên)"}</FieldLabel>
                          <Select
                            value={current}
                            onValueChange={(val) => {
                              const next = selections.filter((s) => s.optionName !== opt.name);
                              next.push({ optionName: opt.name, value: val });
                              form.setValue(`variants.${i}.optionSelections`, next);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn giá trị" />
                            </SelectTrigger>
                            <SelectContent>
                              {(opt.values || []).map((val) => (
                                <SelectItem key={val} value={val}>
                                  {val}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      );
                    })}
                  </div>
                )}

                {/* Bundle components — split-system (dàn lạnh/dàn nóng) etc.
                    Rare (only bundle SKUs use this), so it's collapsed
                    behind a checkbox instead of always taking up space. */}
                <div className="border-t pt-4 space-y-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={bundleExpanded.has(i)}
                      onCheckedChange={(v) => toggleBundle(i, !!v)}
                    />
                    Đây là sản phẩm ghép bộ (bundle, VD: dàn nóng + dàn lạnh)
                  </label>
                </div>
                {bundleExpanded.has(i) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-xs">Linh kiện cấu thành</FieldLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7"
                      disabled={otherVariants.length === 0}
                      onClick={() =>
                        form.setValue(`variants.${i}.components`, [
                          ...components,
                          { componentIndex: otherVariants[0]?.idx ?? 0, quantity: 1, role: "" },
                        ])
                      }
                    >
                      <Plus size={12} className="mr-1" /> Thêm linh kiện
                    </Button>
                  </div>
                  {components.map((comp, ci) => (
                    <div key={ci} className="flex items-center gap-2">
                      <Select
                        value={String(comp.componentIndex)}
                        onValueChange={(val) => {
                          const next = [...components];
                          next[ci] = { ...comp, componentIndex: Number(val) };
                          form.setValue(`variants.${i}.components`, next);
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Chọn biến thể" />
                        </SelectTrigger>
                        <SelectContent>
                          {otherVariants.map((v) => (
                            <SelectItem key={v.id} value={String(v.idx)}>
                              {v.mpn || `Biến thể #${v.idx + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="SL"
                        className="w-16"
                        value={comp.quantity}
                        onChange={(e) => {
                          const next = [...components];
                          next[ci] = { ...comp, quantity: Number(e.target.value) || 1 };
                          form.setValue(`variants.${i}.components`, next);
                        }}
                      />
                      <Input
                        placeholder="VD: Dàn lạnh"
                        className="w-40"
                        value={comp.role || ""}
                        onChange={(e) => {
                          const next = [...components];
                          next[ci] = { ...comp, role: e.target.value };
                          form.setValue(`variants.${i}.components`, next);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => form.setValue(`variants.${i}.components`, components.filter((_, idx) => idx !== ci))}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
                )}
              </div>
            );
          })}
        </RadioGroup>
        {variantsFields.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Chưa có biến thể nào — sản phẩm sẽ dùng giá/SKU/tồn kho ở thẻ &quot;Thông tin sản phẩm&quot; phía trên.
          </p>
        )}
      </FieldSet>
    </FieldGroup>
  );
}
