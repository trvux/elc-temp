"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/shared/components/ui/field";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
import { btuToKw, CAPACITY_BTU_ATTRIBUTE_CODE } from "@/modules/catalog/domain";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductSpecsTabProps {
  form: UseFormReturn<ProductFormValues>;
  attributeDefinitions: AttributeDefinition[];
  // True while the attribute-definitions query is still in flight — the
  // sync effect below must not run yet, see its own doc comment for why.
  isLoading?: boolean;
}

const GLOBAL_GROUP_KEY = "__chung__";

export function ProductSpecsTab({ form, attributeDefinitions, isLoading }: ProductSpecsTabProps) {
  const categoryId = form.watch("categoryId");

  const relevantDefs = attributeDefinitions
    .filter((d) => d.categoryIds.length === 0 || d.categoryIds.includes(categoryId))
    .sort((a, b) => (a.groupLabel || "").localeCompare(b.groupLabel || "") || a.orderIndex - b.orderIndex);

  // useFieldArray (not plain form.setValue on the array) is required here —
  // this array's membership/order changes at runtime (padding in stubs for
  // definitions the product has no value for yet, reordering to match
  // relevantDefs' groupLabel/orderIndex sort), and plain form.setValue()
  // only replaces the VALUE at each path; it doesn't tell RHF the
  // structure changed. RHF still tracks each Controller's registered state
  // by its "attributeValues.{index}.value*" name path, so when the same
  // index later refers to a different attribute definition, the new
  // Controller can inherit the previous occupant's already-registered
  // value instead of the fresh one being passed in — e.g. an untouched,
  // always-blank "Bảo hành tổng" (number) field silently saving whatever
  // number happened to sit at that index a moment earlier ("Công suất làm
  // lạnh", 9200), corrupting a completely unrelated attribute on save.
  // replace() is useFieldArray's own reorder/resize primitive — combined
  // with always deriving each Controller's index from `fields` itself
  // (see the groups/capacityFieldIndex computation below, never from
  // relevantDefs), a slot can never carry over a stale value from
  // whatever used to occupy that array position.
  const { fields, replace } = useFieldArray({ control: form.control, name: "attributeValues" });

  // Keeps the attributeValues field array in sync with whichever
  // definitions apply to the currently-selected category — one entry per
  // definition, preserving existing values by attributeDefinitionId when
  // the set changes (e.g. after switching category). Unlike the plain
  // useState "sync during render" pattern ProductOrganizationCard.tsx uses,
  // this must run in an effect: replace() pushes updates into the
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
    // attributeDefinitions loads async (react-query, defaulted to [] while
    // in flight — see ProductForm.tsx) — running this while it's still
    // empty-because-loading (not empty-because-the-category-genuinely-has-
    // none) would wipe attributeValues to [], and then the very next run
    // (once the real definitions arrive) rebuilds every entry as a blank
    // stub instead of preserving what GetByID actually returned, since by
    // then form.getValues("attributeValues") is already the wiped [].
    // Concretely: every save silently dropped every attribute value,
    // failing validation for every number/boolean-typed one (text/select
    // stubs default to "" which happens to still satisfy the Go backend's
    // non-nil check, masking the same underlying data loss for those).
    if (isLoading) return;
    const existing = form.getValues("attributeValues") || [];
    const byDefId = new Map(existing.map((v) => [v.attributeDefinitionId, v]));
    replace(
      relevantDefs.map(
        (d) =>
          byDefId.get(d.id) || {
            attributeDefinitionId: d.id,
            valueText: "",
            // null, not undefined — RHF's array replace() appears to treat
            // an undefined leaf value as "no change" rather than "clear
            // it", so a blank stub reusing an array slot a differently-
            // typed, filled-in value previously occupied (relevantDefs is
            // re-sorted/padded at runtime, see this effect's doc comment)
            // kept reading back the OLD occupant's stale valueNumber/
            // valueBoolean on submit even though this object never set it.
            valueNumber: null,
            valueBoolean: null,
            valueOptions: [],
          }
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevantKey, isLoading]);

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

  // Grouped from `fields` (useFieldArray's own array), never from
  // relevantDefs — a Controller's `name` must always be built from the
  // SAME array RHF is tracking, at that array's own current index. Doing
  // it the other way around (iterate relevantDefs, look up an index into
  // the values array separately, e.g. via relevantDefs.indexOf or a fresh
  // form.watch().findIndex on every render) lets the computed index drift
  // from what RHF has actually registered for that position — RHF doesn't
  // reset an input's registered value when a Controller's `name` prop
  // changes to point at a different logical item, so a stale value can
  // silently carry over onto an unrelated attribute. Concretely: an
  // untouched, always-blank "Bảo hành tổng" (number) field saving whatever
  // number happened to occupy that array slot a moment earlier ("Công
  // suất làm lạnh", 9200) — corrupting a completely unrelated attribute on
  // save, even though no user ever touched either field.
  const defsById = new Map(attributeDefinitions.map((d) => [d.id, d]));
  const groups: { label: string; entries: { def: AttributeDefinition; index: number }[] }[] = [];
  fields.forEach((f, index) => {
    const def = defsById.get(f.attributeDefinitionId);
    if (!def) return; // stale entry for a deleted/inapplicable definition
    const key = def.groupLabel || GLOBAL_GROUP_KEY;
    let group = groups.find((g) => g.label === key);
    if (!group) {
      group = { label: key, entries: [] };
      groups.push(group);
    }
    group.entries.push({ def, index });
  });

  const capacityFieldIndex = fields.findIndex((f) => defsById.get(f.attributeDefinitionId)?.code === CAPACITY_BTU_ATTRIBUTE_CODE);
  const capacityBtuValue =
    capacityFieldIndex >= 0 ? form.watch(`attributeValues.${capacityFieldIndex}.valueNumber`) : undefined;

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
            {group.entries.map(({ def, index }) => {
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
                        <Input
                          {...field}
                          name={`attr-text-${def.id}`}
                          autoComplete="off"
                          value={field.value || ""}
                          placeholder={`Nhập ${def.name.toLowerCase()}...`}
                        />
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
                            name={`attr-number-${def.id}`}
                            autoComplete="off"
                            value={field.value ?? ""}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                            placeholder="0"
                          />
                        )}
                      />
                      {def.code === CAPACITY_BTU_ATTRIBUTE_CODE && typeof capacityBtuValue === "number" && capacityBtuValue > 0 && (
                        <FieldDescription>≈ {btuToKw(capacityBtuValue)} kW (tự tính từ BTU/h)</FieldDescription>
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

                  {def.dataType === "multiselect" && (
                    <Controller
                      control={form.control}
                      name={`attributeValues.${index}.valueOptions`}
                      render={({ field }) => {
                        const selected = field.value || [];
                        function toggle(opt: string) {
                          field.onChange(
                            selected.includes(opt)
                              ? selected.filter((v) => v !== opt)
                              : [...selected, opt]
                          );
                        }
                        return (
                          <div className="flex flex-wrap gap-3 pt-1">
                            {def.options.map((opt) => (
                              <label key={opt} className="flex items-center gap-2 text-sm">
                                <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
                                {opt}
                              </label>
                            ))}
                          </div>
                        );
                      }}
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
