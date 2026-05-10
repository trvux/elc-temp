"use client";

import {
  createCategoryAction,
  deleteCategoryAction,
  getCategoriesAction,
  updateCategoryAction,
} from "@/modules/category/presentation/actions";
import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { capitalize } from "@/shared/lib/utils";
import { CornerDownRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getColumns, type CategoryRow } from "./columns";

import {
  createCategorySchema,
  type Category,
  type CategoryType,
} from "@/modules/category/domain";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

type CategoryFormValues = z.infer<typeof createCategorySchema>;

export function CategoryManagement() {
  const queryClient = useQueryClient();

  // Consolidate states
  const [activeCategory, setActiveCategory] = useState<Category | "new" | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(createCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      type: "PRODUCT",
      parentId: null,
    },
  });

  // Fetch Data
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      if (activeCategory && activeCategory !== "new") {
        return updateCategoryAction({
          id: activeCategory.id,
          ...values,
        });
      }
      return createCategoryAction(values);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeCategory === "new" ? "Đã tạo danh mục" : "Đã cập nhật danh mục",
      );
      setActiveCategory(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

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

    if (result.length < categories.length) {
      categories.forEach((c) => {
        if (!visited.has(c.id)) {
          result.push({ ...c, level: 0 });
          visited.add(c.id);
        }
      });
    }
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

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  const parentId = form.watch("parentId");
  const internalSlug = form.watch("slug");
  const type = form.watch("type");
  const name = form.watch("name");

  const fullSlug = useMemo(() => {
    if (!parentId) return internalSlug;
    const parent = categories.find((c) => c.id === parentId);
    if (!parent) return internalSlug;
    return `${parent.slug}-${internalSlug}`;
  }, [parentId, internalSlug, categories]);

  function parentOptions(forType: CategoryType) {
    return categories.filter((c) => !c.parentId && c.type === forType);
  }

  function openCreate() {
    setActiveCategory("new");
    form.reset({
      name: "",
      slug: "",
      type: "PRODUCT",
      parentId: null,
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý cấu trúc danh mục sản phẩm và dự án.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Thêm danh mục
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
        size="lg"
        title={activeCategory === "new" ? "Thêm danh mục" : "Sửa danh mục"}
        description={
          activeCategory !== "new"
            ? "Cập nhật thông tin cho danh mục này."
            : "Điền thông tin bên dưới để tạo danh mục mới."
        }
      >
        <form
          onSubmit={form.handleSubmit((v) =>
            saveMutation.mutate({ ...v, slug: fullSlug }),
          )}
          className="space-y-6"
        >
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel className="min-w-[140px] pt-2 font-medium">
                Tên danh mục
              </FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      className="w-full"
                      placeholder="VD: Máy lạnh âm trần"
                      {...field}
                      onChange={(e) => {
                        const val = capitalize(e.target.value);
                        field.onChange(val);
                        form.setValue("slug", generateSlug(val));
                      }}
                    />
                  )}
                />
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="min-w-[140px] pt-2 font-medium">
                Slug / Đường dẫn
              </FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <Input
                      className="w-full font-mono text-sm"
                      placeholder="may-lanh-am-tran"
                      {...field}
                      onChange={(e) =>
                        field.onChange(generateSlug(e.target.value))
                      }
                    />
                  )}
                />
                <FieldDescription className="mt-1.5 text-xs">
                  Đường dẫn đầy đủ:{" "}
                  <span className="font-mono text-primary font-medium">
                    /{fullSlug || "..."}
                  </span>
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="min-w-[140px] pt-2 font-medium">
                Loại
              </FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("parentId", null);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCT">Sản phẩm</SelectItem>
                        <SelectItem value="PROJECT">Dự án</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="min-w-[140px] pt-2 font-medium">
                Danh mục cha
              </FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? null : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Không có (cấp 1)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có (cấp 1)</SelectItem>
                        {parentOptions(type)
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
                  )}
                />
                {parentId && (
                  <FieldDescription className="mt-1.5 flex items-center gap-1 text-xs">
                    Đường dẫn:
                    <span className="font-medium text-foreground">
                      {categories.find((c) => c.id === parentId)?.name}
                    </span>
                    <CornerDownRight
                      size={12}
                      className="mx-0.5 text-muted-foreground"
                    />
                    <span className="font-medium text-primary">
                      {name || "..."}
                    </span>
                  </FieldDescription>
                )}
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              type="button"
              onClick={() => setActiveCategory(null)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isLoading}>
              {saveMutation.isLoading
                ? "Đang lưu..."
                : activeCategory === "new"
                  ? "Tạo mới"
                  : "Cập nhật"}
            </Button>
          </div>
        </form>
      </AdminDialog>

      <DeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isLoading}
        title="Xóa danh mục này?"
        description="Lưu ý: Tất cả danh mục con (nếu có) cũng sẽ bị xóa vĩnh viễn khỏi hệ thống."
      />
    </div>
  );
}
