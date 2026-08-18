"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { Check, CaretUpDown, X } from "@phosphor-icons/react";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/organisms/layout/admin/delete-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/components/ui/command";
import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { TagInput } from "@/shared/components/ui/tag-input";
import { cn } from "@/shared/lib/utils";
import { getCategoriesAction } from "@/modules/category/presentation/actions";

import { AttributeDefinition, AttributeDataType } from "../../domain";
import { deleteAttributeDefinitionAction, getAttributeDefinitionsAction } from "../actions";
import { useAttributeDefinitionForm } from "../hooks/useAttributeDefinitionForm";

const DATA_TYPE_LABELS: Record<AttributeDataType, string> = {
  text: "Văn bản",
  number: "Số",
  boolean: "Có/Không",
  select: "Chọn 1 giá trị",
  multiselect: "Chọn nhiều giá trị",
};

const GLOBAL_GROUP_KEY = "__global__";

export function AttributeDefinitionManagement() {
  const queryClient = useQueryClient();
  const [activeDefinition, setActiveDefinition] = useState<AttributeDefinition | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: definitions = [], isLoading } = useQuery({
    queryKey: ["attribute-definitions"],
    queryFn: async () => {
      const { data, error } = await getAttributeDefinitionsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-new"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { form, saveMutation } = useAttributeDefinitionForm(activeDefinition, () => setActiveDefinition(null));

  const deleteMutation = useMutation({
    mutationFn: deleteAttributeDefinitionAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa thuộc tính");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["attribute-definitions"] });
    },
  });

  function onEdit(def: AttributeDefinition) {
    setActiveDefinition(def);
    form.reset({
      categoryIds: def.categoryIds,
      code: def.code,
      name: def.name,
      groupLabel: def.groupLabel || "",
      dataType: def.dataType,
      unit: def.unit || "",
      options: def.options || [],
      orderIndex: def.orderIndex,
      isRequired: def.isRequired,
    });
  }

  function openCreate(categoryId: string | null) {
    setActiveDefinition("new");
    form.reset({
      categoryIds: categoryId ? [categoryId] : [],
      code: "",
      name: "",
      groupLabel: "",
      dataType: "text",
      unit: "",
      options: [],
      orderIndex: 0,
      isRequired: false,
    });
  }

  const filteredDefinitions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return definitions;
    return definitions.filter((d) =>
      [d.name, d.code, d.groupLabel || ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [definitions, search]);

  const categoryGroups = useMemo(() => {
    const byCategory = new Map<string, AttributeDefinition[]>();
    for (const def of filteredDefinitions) {
      const keys = def.categoryIds.length > 0 ? def.categoryIds : [GLOBAL_GROUP_KEY];
      for (const key of keys) {
        const group = byCategory.get(key) ?? [];
        group.push(def);
        byCategory.set(key, group);
      }
    }

    const namedGroups = categories
      .map((cat) => ({
        key: cat.id,
        label: cat.name,
        defs: (byCategory.get(cat.id) ?? []).sort((a, b) => (a.groupLabel || "").localeCompare(b.groupLabel || "") || a.orderIndex - b.orderIndex),
      }))
      .filter((g) => g.defs.length > 0);

    const globalDefs = (byCategory.get(GLOBAL_GROUP_KEY) ?? []).sort((a, b) => a.orderIndex - b.orderIndex);
    const globalGroup = globalDefs.length > 0
      ? [{ key: GLOBAL_GROUP_KEY, label: "Áp dụng cho mọi danh mục", defs: globalDefs }]
      : [];

    return [...globalGroup, ...namedGroups.sort((a, b) => a.label.localeCompare(b.label))];
  }, [categories, filteredDefinitions]);

  const isEditing = activeDefinition !== "new" && activeDefinition !== null;
  const dataType = form.watch("dataType");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thuộc tính sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Định nghĩa thông số kỹ thuật theo danh mục — thay cho việc gõ nhãn tự do (VD: Công suất làm lạnh, Độ ồn...).
          </p>
        </div>
        <Button onClick={() => openCreate(null)} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm thuộc tính
        </Button>
      </div>

      <Input
        placeholder="Tìm kiếm theo tên, mã hoặc nhóm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-4"
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 h-24 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Đang tải dữ liệu...
        </div>
      ) : categoryGroups.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border rounded-md">
          Không có dữ liệu.
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={categoryGroups.map((g) => g.key)} className="border rounded-md bg-card px-4">
          {categoryGroups.map((group) => (
            <AccordionItem key={group.key} value={group.key}>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  {group.label}
                  <Badge variant="secondary">{group.defs.length}</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-md border overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-180 text-sm table-fixed">
                    <colgroup>
                      <col className="w-40" />
                      <col />
                      <col className="w-32" />
                      <col className="w-28" />
                      <col className="w-24" />
                      <col className="w-24" />
                    </colgroup>
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Mã</th>
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Tên thuộc tính</th>
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Nhóm</th>
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Kiểu dữ liệu</th>
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Bắt buộc</th>
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.defs.map((def) => (
                        <tr key={def.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-3 align-middle font-mono text-xs text-muted-foreground">{def.code}</td>
                          <td className="p-3 align-middle">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-foreground">{def.name}</span>
                              {def.unit && <span className="text-xs text-muted-foreground">Đơn vị: {def.unit}</span>}
                              {(def.dataType === "select" || def.dataType === "multiselect") && def.options.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {def.options.map((opt) => (
                                    <Badge key={opt} variant="outline" className="text-xs px-1 py-0 h-4 font-normal">
                                      {opt}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 align-middle text-muted-foreground">{def.groupLabel || "—"}</td>
                          <td className="p-3 align-middle">
                            <Badge variant="secondary">{DATA_TYPE_LABELS[def.dataType]}</Badge>
                          </td>
                          <td className="p-3 align-middle">{def.isRequired ? "Có" : "—"}</td>
                          <td className="p-3 align-middle">
                            <ButtonGroup>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(def)}
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                              >
                                <PencilSimple size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingId(def.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash size={14} />
                              </Button>
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <AdminDialog
        open={!!activeDefinition}
        onOpenChange={(open) => !open && setActiveDefinition(null)}
        title={activeDefinition === "new" ? "Thêm thuộc tính" : "Sửa thuộc tính"}
        description="Nhập thông tin thuộc tính kỹ thuật."
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" type="button" onClick={() => setActiveDefinition(null)}>
              Hủy
            </Button>
            <Button type="submit" form="attribute-definition-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        }
      >
        <form
          id="attribute-definition-form"
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="space-y-6"
        >
          <FieldGroup className="max-w-xl mx-auto gap-5">
            <Controller
              control={form.control}
              name="categoryIds"
              render={({ field }) => {
                const selectedIds: string[] = field.value || [];
                const selectedCategories = categories.filter((c) => selectedIds.includes(c.id));
                function toggle(id: string) {
                  field.onChange(
                    selectedIds.includes(id)
                      ? selectedIds.filter((v) => v !== id)
                      : [...selectedIds, id]
                  );
                }
                return (
                  <Field>
                    <FieldLabel>Danh mục</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                          {selectedIds.length > 0
                            ? `${selectedIds.length} danh mục đã chọn`
                            : "Áp dụng cho mọi danh mục (chung)"}
                          <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Tìm danh mục..." />
                          <CommandList>
                            <CommandEmpty>Không tìm thấy danh mục nào.</CommandEmpty>
                            <CommandGroup>
                              {categories.map((c) => (
                                <CommandItem key={c.id} value={c.name} onSelect={() => toggle(c.id)}>
                                  <Check className={cn("mr-2 h-4 w-4", selectedIds.includes(c.id) ? "opacity-100" : "opacity-0")} />
                                  {c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedCategories.map((c) => (
                          <Badge key={c.id} variant="secondary" className="gap-1">
                            {c.name}
                            <button type="button" onClick={() => toggle(c.id)} className="ml-0.5 rounded-full hover:bg-muted-foreground/20">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FieldDescription>Để trống = áp dụng cho mọi danh mục. Có thể chọn nhiều danh mục anh em dùng chung 1 thuộc tính.</FieldDescription>
                  </Field>
                );
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="code"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Mã thuộc tính *</FieldLabel>
                    <Input {...field} placeholder="VD: cong_suat_lam_lanh_btu" disabled={isEditing} />
                    <FieldDescription>Chữ thường, số, gạch dưới — không đổi được sau khi tạo.</FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="dataType"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Kiểu dữ liệu *</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(DATA_TYPE_LABELS) as [AttributeDataType, string][]).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isEditing && (
                      <FieldDescription>Không thể đổi kiểu dữ liệu sau khi tạo.</FieldDescription>
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Tên thuộc tính *</FieldLabel>
                  <Input {...field} placeholder="VD: Công suất làm lạnh" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="groupLabel"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Nhóm hiển thị (tùy chọn)</FieldLabel>
                  <Input {...field} value={field.value || ""} placeholder="VD: Dàn lạnh, Dàn nóng — để trống nếu thuộc nhóm chung" />
                </Field>
              )}
            />

            {dataType === "number" && (
              <Controller
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Đơn vị</FieldLabel>
                    <Input {...field} value={field.value || ""} placeholder="VD: BTU/h, kg, m, W" />
                  </Field>
                )}
              />
            )}

            {(dataType === "select" || dataType === "multiselect") && (
              <Controller
                control={form.control}
                name="options"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Danh sách giá trị được chọn</FieldLabel>
                    <TagInput
                      values={field.value || []}
                      onChange={field.onChange}
                      placeholder="VD: R32, R410A, R22..."
                    />
                    <FieldDescription>
                      {dataType === "multiselect"
                        ? "Admin có thể chọn nhiều giá trị trong danh sách này khi nhập sản phẩm."
                        : "Admin chỉ được chọn 1 trong các giá trị này khi nhập sản phẩm."}
                    </FieldDescription>
                  </Field>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
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
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <Field orientation="horizontal" className="justify-between border p-3 rounded-lg self-end h-10">
                    <FieldLabel className="font-normal mb-0">Bắt buộc nhập</FieldLabel>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(!!v)} />
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </form>
      </AdminDialog>

      <DeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
