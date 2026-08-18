"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/organisms/layout/admin/delete-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { TagInput } from "@/shared/components/ui/tag-input";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";

import { ProductLine } from "../../domain";
import { deleteProductLineAction, getProductLinesAction } from "../actions";
import { useProductLineForm } from "../hooks/useProductLineForm";

export function ProductLineManagement() {
  const queryClient = useQueryClient();
  const [activeLine, setActiveLine] = useState<ProductLine | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ["product-lines"],
    queryFn: async () => {
      const { data, error } = await getProductLinesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await getBrandsAction();
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

  const { form, saveMutation } = useProductLineForm(activeLine, () => setActiveLine(null));

  const deleteMutation = useMutation({
    mutationFn: deleteProductLineAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa dòng sản phẩm");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["product-lines"] });
    },
  });

  const [search, setSearch] = useState("");

  function onEdit(line: ProductLine) {
    setActiveLine(line);
    form.reset({
      brandId: line.brandId,
      categoryId: line.categoryId ?? null,
      code: line.code,
      name: line.name,
      tierRank: line.tierRank,
      description: line.description || "",
      mpnPrefixes: line.mpnPrefixes || [],
    });
  }

  const filteredLines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((l) =>
      [l.name, l.code, ...l.mpnPrefixes].some((v) => v.toLowerCase().includes(q))
    );
  }, [lines, search]);

  const brandGroups = useMemo(() => {
    const byBrand = new Map<string, ProductLine[]>();
    for (const line of filteredLines) {
      const group = byBrand.get(line.brandId) ?? [];
      group.push(line);
      byBrand.set(line.brandId, group);
    }
    return brands
      .map((brand) => ({
        brand,
        lines: (byBrand.get(brand.id) ?? []).sort((a, b) => a.tierRank - b.tierRank),
      }))
      .filter((g) => g.lines.length > 0)
      .sort((a, b) => a.brand.name.localeCompare(b.brand.name));
  }, [brands, filteredLines]);

  function openCreate() {
    setActiveLine("new");
    form.reset({
      brandId: "",
      categoryId: null,
      code: "",
      name: "",
      tierRank: 0,
      description: "",
      mpnPrefixes: [],
    });
  }

  const isEditing = activeLine !== "new" && activeLine !== null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dòng sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các dòng/tier sản phẩm theo thương hiệu (VD: Daikin FTKB, FTKZ...).
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm dòng sản phẩm
        </Button>
      </div>

      <Input
        placeholder="Tìm kiếm theo tên dòng, mã dòng hoặc mã MPN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-4"
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 h-24 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Đang tải dữ liệu...
        </div>
      ) : brandGroups.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border rounded-md">
          Không có dữ liệu.
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={brandGroups.map((g) => g.brand.id)} className="border rounded-md bg-card px-4">
          {brandGroups.map(({ brand, lines: brandLines }) => (
            <AccordionItem key={brand.id} value={brand.id}>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  {brand.name}
                  <Badge variant="secondary">{brandLines.length}</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-md border overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-180 text-sm table-fixed">
                    <colgroup>
                      <col className="w-72" />
                      <col />
                      <col className="w-24" />
                      <col className="w-24" />
                    </colgroup>
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Mã MPN</th>
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Tên dòng sản phẩm</th>
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Thứ hạng</th>
                        <th className="h-9 px-3 text-left font-medium text-muted-foreground">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brandLines.map((line) => (
                        <tr key={line.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-3 align-middle">
                            <div className="flex flex-wrap gap-1">
                              {line.mpnPrefixes.length === 0 && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                              {line.mpnPrefixes.map((prefix) => (
                                <Badge key={prefix} variant="outline" className="font-mono">
                                  {prefix}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 align-middle">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-foreground">{line.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{line.code}</span>
                            </div>
                          </td>
                          <td className="p-3 align-middle">{line.tierRank}</td>
                          <td className="p-3 align-middle">
                            <ButtonGroup>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(line)}
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                              >
                                <PencilSimple size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingId(line.id)}
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
        open={!!activeLine}
        onOpenChange={(open) => !open && setActiveLine(null)}
        title={activeLine === "new" ? "Thêm dòng sản phẩm" : "Sửa dòng sản phẩm"}
        description="Nhập thông tin dòng/tier sản phẩm."
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex-1 flex flex-col min-h-0 w-full"
        >
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <FieldGroup className="max-w-xl mx-auto gap-5">
              <Controller
                control={form.control}
                name="brandId"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Thương hiệu *</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
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
                    {isEditing && (
                      <FieldDescription>Không thể đổi thương hiệu sau khi tạo.</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Danh mục (tùy chọn)</FieldLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Áp dụng cho mọi danh mục" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-80 overflow-y-auto">
                        <SelectItem value="none">Áp dụng cho mọi danh mục</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>Để trống nếu dòng này áp dụng chung, không giới hạn 1 danh mục.</FieldDescription>
                  </Field>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={form.control}
                  name="code"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Mã dòng (nội bộ) *</FieldLabel>
                      <Input {...field} placeholder="VD: FTKZ" disabled={isEditing} />
                      <FieldDescription>Định danh ngắn, không đổi được sau khi tạo.</FieldDescription>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="tierRank"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Thứ hạng</FieldLabel>
                      <Input
                        type="number"
                        {...field}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                      <FieldDescription>Thấp → cao cấp, dùng để sắp xếp.</FieldDescription>
                    </Field>
                  )}
                />
              </div>

              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Tên dòng *</FieldLabel>
                    <Input {...field} placeholder="VD: Dòng Inverter siêu cao cấp" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="mpnPrefixes"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Mã MPN thuộc dòng này</FieldLabel>
                    <TagInput
                      values={field.value || []}
                      onChange={field.onChange}
                      placeholder="VD: FTF, FTC..."
                    />
                    <FieldDescription>
                      Sản phẩm có mã MPN bắt đầu bằng 1 trong các tiền tố này sẽ được gán vào dòng này.
                    </FieldDescription>
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Mô tả</FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Mô tả ngắn về dòng sản phẩm này..."
                      className="min-h-20"
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
            <Button variant="ghost" type="button" onClick={() => setActiveLine(null)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
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
