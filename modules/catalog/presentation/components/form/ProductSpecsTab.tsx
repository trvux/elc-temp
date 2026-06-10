"use client";

import { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/shared/components/ui/field";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";
import { ProductFormValues } from "../../hooks/useProductForm";
import { SpecItem, SpecSubItem } from "@/modules/catalog/domain/types";

interface ProductSpecsTabProps {
  form: UseFormReturn<ProductFormValues>;
  specsFields: FieldArrayWithId<ProductFormValues, "specs", "id">[];
  appendSpec: (value: SpecItem) => void;
  removeSpec: (index: number) => void;
  appendSpecItem: (index: number, item: SpecSubItem) => void;
  removeSpecItem: (specIndex: number, itemIndex: number) => void;
  updateAutoSlug: (name: string, sku: string, catId: string, brdId: string, specs: SpecItem[]) => void;
}

export function ProductSpecsTab({
  form,
  specsFields,
  appendSpec,
  removeSpec,
  appendSpecItem,
  removeSpecItem,
  updateAutoSlug,
}: ProductSpecsTabProps) {
  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend>Thông số kỹ thuật</FieldLegend>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendSpec({ label: "", value: "" })}
        >
          <Plus size={14} className="mr-2" /> Thêm thông số mới
        </Button>
      </div>

      <FieldGroup className="gap-6">
        {specsFields.map((field, i) => {
          const spec = form.watch(`specs.${i}`);
          const hasItems = spec?.items && spec.items.length > 0;

          return (
            <div key={field.id} className="border p-6 rounded-xl bg-muted/5">
              <FieldGroup className="gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Tên thông số (Nhãn)</FieldLabel>
                    <Input
                      placeholder="VD: Kích thước"
                      {...form.register(`specs.${i}.label`)}
                    />
                  </Field>

                  {!hasItems && (
                    <Field>
                      <FieldLabel>Giá trị hiển thị</FieldLabel>
                      <Input
                        placeholder="VD: 800 x 600 mm"
                        {...form.register(`specs.${i}.value`, {
                          onChange: () =>
                            updateAutoSlug(
                              form.getValues("name"),
                              form.getValues("sku"),
                              form.getValues("categoryId"),
                              form.getValues("brandId"),
                              form.getValues("specs")
                            ),
                        })}
                      />
                    </Field>
                  )}
                </div>

                {hasItems && (
                  <FieldSet className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <FieldLegend variant="label" className="text-sm">
                        Danh sách mục con
                      </FieldLegend>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          appendSpecItem(i, {
                            label: "",
                            value: "",
                          })
                        }
                      >
                        <Plus size={14} className="mr-1" /> Thêm mục
                      </Button>
                    </div>

                    <FieldGroup className="gap-3">
                      {spec.items?.map((_: SpecSubItem, j: number) => (
                        <Field
                          key={j}
                          orientation="horizontal"
                          className="gap-2"
                        >
                          <Input
                            placeholder="Nhãn"
                            {...form.register(
                              `specs.${i}.items.${j}.label`
                            )}
                          />
                          <Input
                            placeholder="Giá trị"
                            {...form.register(
                              `specs.${i}.items.${j}.value`
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => removeSpecItem(i, j)}
                          >
                            <X size={14} />
                          </Button>
                        </Field>
                      ))}
                    </FieldGroup>
                  </FieldSet>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  {!hasItems && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        appendSpecItem(i, {
                          label: "",
                          value: "",
                        });
                        form.setValue(
                          `specs.${i}.value`,
                          undefined
                        );
                      }}
                    >
                      + Nhóm con
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeSpec(i)}
                  >
                    <Trash2 size={14} className="mr-1" /> Xóa thông số
                  </Button>
                </div>
              </FieldGroup>
            </div>
          );
        })}
      </FieldGroup>
    </FieldSet>
  );
}
