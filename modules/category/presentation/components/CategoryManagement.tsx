"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CornerDownRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
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
import { capitalize, generateSlug } from "@/shared/lib/utils";

import { Category } from "../../domain";
import { deleteCategoryAction, getCategoriesAction } from "../actions";
import { useCategoryForm } from "../hooks/useCategoryForm";
import { getColumns, type CategoryRow } from "./columns";

export function CategoryManagement() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<Category | "new" | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Data
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Custom Form Hook
  const {
    form,
    saveMutation,
    fullSlug,
    onNameChange,
    getParentOptions,
    type,
    parentId,
  } = useCategoryForm(
    activeCategory,
    () => setActiveCategory(null),
    categories,
  );

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCategoryAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa danh mục");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const flattenedData = useMemo(() => {
    const rootCategories = categories.filter(
      (c) => !c.parentId || !categories.find((p) => p.id === c.parentId),
    );

    const result: CategoryRow[] = [];
    const visited = new Set<string>();

    const processCategory = (cat: Category, level: number) => {
      if (visited.has(cat.id)) return;
      visited.add(cat.id);
      result.push({ ...cat, level });
      const children = categories.filter((c) => c.parentId === cat.id);
      children.sort((a, b) => a.name.localeCompare(b.name));
      children.forEach((child) => processCategory(child, level + 1));
    };

    rootCategories.sort((a, b) => a.name.localeCompare(b.name));
    rootCategories.forEach((root) => processCategory(root, 0));

    return result;
  }, [categories]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (cat) => {
          const c = cat as Category;
          setActiveCategory(c);
          const slugParts = c.slug?.split("-") || [""];
          form.reset({
            name: c.name,
            slug: slugParts[slugParts.length - 1],
            type: c.type,
            parentId: c.parentId,
            metaTitle: c.metaTitle || "",
            metaDescription: c.metaDescription || "",
          });
        },
        onDelete: (id) => {
          const hasChildren = categories.some((c) => c.parentId === id);
          if (hasChildren) {
            toast.error("Vui lòng xóa các danh mục con trước");
            return;
          }
          setDeletingId(id);
        },
      }),
    [categories, form],
  );

  function openCreate() {
    setActiveCategory("new");
    form.reset({
      name: "",
      slug: "",
      type: "PRODUCT",
      parentId: null,
      metaTitle: "",
      metaDescription: "",
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý cấu trúc danh mục sản phẩm và dự án.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm danh mục
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={flattenedData}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm kiếm danh mục..."
        rowClassName={(row: CategoryRow) =>
          row.level === 0 ? "bg-muted-foreground/5" : ""
        }
      />

      <AdminDialog
        open={!!activeCategory}
        onOpenChange={(open) => !open && setActiveCategory(null)}
        title={activeCategory === "new" ? "Thêm danh mục" : "Sửa danh mục"}
        description="Quản lý thông tin và phân cấp danh mục."
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex flex-col gap-6"
        >
          <FieldGroup className="flex flex-col gap-5">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Tên danh mục *</FieldLabel>
                  <Input
                    {...field}
                    placeholder="VD: Máy lạnh âm trần"
                    onChange={(e) => {
                      const val = capitalize(e.target.value);
                      field.onChange(val);
                      form.setValue("slug", generateSlug(val));
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="slug"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Slug / Đường dẫn</FieldLabel>
                  <Input
                    {...field}
                    placeholder="may-lanh-am-tran"
                    onChange={(e) =>
                      field.onChange(generateSlug(e.target.value))
                    }
                  />
                  <FieldDescription>
                    Đường dẫn đầy đủ:{" "}
                    <span className="font-mono text-primary">
                      /{fullSlug || "..."}
                    </span>
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Loại danh mục</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("parentId", null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCT">Sản phẩm</SelectItem>
                        <SelectItem value="PROJECT">Dự án</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Danh mục cha</FieldLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? null : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Không có (Cấp 1)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có (Cấp 1)</SelectItem>
                        {getParentOptions(type)
                          .filter(
                            (p) =>
                              p.id !==
                              (activeCategory !== "new"
                                ? activeCategory?.id
                                : null),
                          )
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {parentId && (
                      <FieldDescription className="flex items-center gap-1">
                        Phân cấp:{" "}
                        <span className="text-foreground">
                          {categories.find((c) => c.id === parentId)?.name}
                        </span>
                        <CornerDownRight
                          size={12}
                          className="text-muted-foreground"
                        />
                        <span className="text-primary font-medium">
                          {form.watch("name") || "..."}
                        </span>
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          {/* SEO Section */}
          <div className="space-y-5 border p-5 rounded-2xl bg-muted/10">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold tracking-tight">Cấu hình SEO</h3>
              <p className="text-[11px] text-muted-foreground">Tối ưu hóa hiển thị trên các công cụ tìm kiếm.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Controller
                control={form.control}
                name="metaTitle"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Tiêu đề SEO</FieldLabel>
                    <Input {...field} value={field.value || ""} placeholder="Để trống sẽ tự động dùng tên danh mục..." />
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
                    <Textarea {...field} value={field.value || ""} placeholder="Mô tả tóm tắt danh mục hiển thị trên Google..." className="min-h-[80px]" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setActiveCategory(null)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Đang lưu..."
                : activeCategory === "new"
                  ? "Tạo danh mục"
                  : "Lưu thay đổi"}
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
