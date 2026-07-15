"use client";

import { useEffect } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { AttributeDefinition } from "@/modules/attribute-definition/domain";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductSpecsTabProps {
  form: UseFormReturn<ProductFormValues>;
  attributeDefinitions: AttributeDefinition[];
}

// 1 kW = 3412.14 BTU/h — a fixed physics conversion, safe to auto-derive for
// display. Unlike this, HP ("ngựa") is a VN retail marketing bucket brands
// assign inconsistently around the BTU value, so it stays its own
// admin-picked select attribute (cong_suat_lam_lanh_hp), never computed.
const BTU_PER_KW = 3412.14;
const CAPACITY_BTU_CODE = "cong_suat_lam_lanh_btu";

const GLOBAL_GROUP_KEY = "__chung__";

export function ProductSpecsTab({ form, attributeDefinitions }: ProductSpecsTabProps) {
  const categoryId = form.watch("categoryId");

  const relevantDefs = attributeDefinitions
    .filter((d) => d.categoryId === categoryId || d.categoryId == null)
    .sort((a, b) => (a.groupLabel || "").localeCompare(b.groupLabel || "") || a.orderIndex - b.orderIndex);

  // Keeps the attributeValues field array in sync with whichever
  // definitions apply to the currently-selected category — one entry per
  // definition, preserving existing values by attributeDefinitionId when
  // the set changes (e.g. after switching category). Unlike the plain
  // useState "sync during render" pattern ProductOrganizationCard.tsx uses,
  // this must run in an effect: form.setValue() pushes updates into the
  // Controller children's subscriptions, which React doesn't allow doing
  // synchronously during a different component's render (see the "Cannot
  // update a component while rendering a different component" warning).
  //
  // Must also run on mount, not just when relevantKey later changes —
  // otherwise an edited product whose attributeValues (loaded from the DB)
  // don't already cover every definition for its category (new attribute
  // definitions added after the product was last saved, or a product that
  // predates this being editable at all) submits with attributeValues
  // entries missing attributeDefinitionId, which fails validation on every
  // entry and silently blocks the whole save. React's dependency array
  // already dedupes re-runs when relevantKey is unchanged between renders —
  // an extra "skip on first run" guard here previously suppressed exactly
  // the mount-time merge that fixes this.
  const relevantKey = relevantDefs.map((d) => d.id).join(",");
  useEffect(() => {
    const existing = form.getValues("attributeValues") || [];
    const byDefId = new Map(existing.map((v) => [v.attributeDefinitionId, v]));
    form.setValue(
      "attributeValues",
      relevantDefs.map(
        (d) =>
          byDefId.get(d.id) || {
            attributeDefinitionId: d.id,
            valueText: "",
            valueNumber: undefined,
            valueBoolean: undefined,
          }
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevantKey]);

  const scrollToCategory = () => {
    document
      .getElementById("product-category-field")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (relevantDefs.length === 0) {
    return (
      <FieldDescription>
        {categoryId ? (
          "Danh mục này chưa có thuộc tính nào — thêm ở trang \"Thuộc tính sản phẩm\" trong sidebar."
        ) : (
          <>
            Chưa chọn danh mục —{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={scrollToCategory}
            >
              chọn danh mục ở thẻ &quot;Phân loại&quot; phía trên
            </button>{" "}
            để thấy đúng bộ thuộc tính.
          </>
        )}
      </FieldDescription>
    );
  }

  const groups: { label: string; defs: AttributeDefinition[] }[] = [];
  for (const def of relevantDefs) {
    const key = def.groupLabel || GLOBAL_GROUP_KEY;
    let group = groups.find((g) => g.label === key);
    if (!group) {
      group = { label: key, defs: [] };
      groups.push(group);
    }
    group.defs.push(def);
  }

  const capacityBtu = relevantDefs.find((d) => d.code === CAPACITY_BTU_CODE);
  const capacityIndex = capacityBtu ? relevantDefs.indexOf(capacityBtu) : -1;
  const capacityBtuValue = capacityIndex >= 0 ? form.watch(`attributeValues.${capacityIndex}.valueNumber`) : undefined;

  return (
    <>
      <FieldDescription className="mb-5">
        Bộ thuộc tính theo danh mục đã chọn — quản lý danh sách thuộc tính ở trang &quot;Thuộc tính sản phẩm&quot;.
      </FieldDescription>

      {groups.map((group, gi) => (
        <div key={group.label}>
          {gi > 0 && <FieldSeparator className="my-6" />}
          {group.label !== GLOBAL_GROUP_KEY && (
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">{group.label}</h4>
          )}
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {group.defs.map((def) => {
              const index = relevantDefs.indexOf(def);
              return (
                <Field key={def.id}>
                  <FieldLabel>
                    {def.name}
                    {def.isRequired && " *"}
                    {def.unit && <span className="text-muted-foreground font-normal"> ({def.unit})</span>}
                  </FieldLabel>

                  {def.dataType === "text" && (
                    <Controller
                      control={form.control}
                      name={`attributeValues.${index}.valueText`}
                      render={({ field }) => (
                        <Input {...field} value={field.value || ""} placeholder={`Nhập ${def.name.toLowerCase()}...`} />
                      )}
                    />
                  )}

                  {def.dataType === "number" && (
                    <>
                      <Controller
                        control={form.control}
                        name={`attributeValues.${index}.valueNumber`}
                        render={({ field }) => (
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                            placeholder="0"
                          />
                        )}
                      />
                      {def.code === CAPACITY_BTU_CODE && typeof capacityBtuValue === "number" && capacityBtuValue > 0 && (
                        <FieldDescription>≈ {(capacityBtuValue / BTU_PER_KW).toFixed(2)} kW (tự tính từ BTU/h)</FieldDescription>
                      )}
                    </>
                  )}

                  {def.dataType === "boolean" && (
                    <Controller
                      control={form.control}
                      name={`attributeValues.${index}.valueBoolean`}
                      render={({ field }) => (
                        <div className="flex items-center h-9">
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />
                  )}

                  {def.dataType === "select" && (
                    <Controller
                      control={form.control}
                      name={`attributeValues.${index}.valueText`}
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn giá trị" />
                          </SelectTrigger>
                          <SelectContent>
                            {def.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                </Field>
              );
            })}
          </FieldGroup>
        </div>
      ))}
    </>
  );
}
