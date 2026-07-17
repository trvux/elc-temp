"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowSquareOut } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldDescription,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { getGroupsAction } from "@/modules/group/presentation/actions";

import { CategoryWithGroup } from "../../domain";
import { deleteCategoryAction, getCategoriesAction } from "../actions";
import { useCategoryForm } from "../hooks/useCategoryForm";
import { getColumns } from "./columns";

export function CategoryManagement() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<CategoryWithGroup | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Data
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories-new"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await getGroupsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Form Hook
  const { form, saveMutation, onNameChange } = useCategoryForm(
    activeCategory,
    () => setActiveCategory(null)
  );

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCategoryAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa danh mục mới");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["categories-new"] });
      queryClient.invalidateQueries({ queryKey: ["project-types"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const gA = a.group?.name || "zzz_Khác";
      const gB = b.group?.name || "zzz_Khác";
      return gA.localeCompare(gB, "vi");
    });
  }, [categories]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (cat) => {
          setActiveCategory(cat);
          form.reset({
            name: cat.name,
            groupId: cat.groupId || null,
            slug: cat.slug || "",
            imageUrl: cat.imageUrl || "",
            metaTitle: cat.metaTitle || "",
            metaDescription: cat.metaDescription || "",
            isFeatured: cat.isFeatured || false,
            orderIndex: cat.orderIndex || 0,
            content: cat.content || "",
          });
        },
        onDelete: (id) => {
          setDeletingId(id);
        },
      }),
    [form]
  );

  function openCreate() {
    setActiveCategory("new");
    form.reset({
      name: "",
      groupId: null,
      slug: "",
      imageUrl: "",
      metaTitle: "",
      metaDescription: "",
      isFeatured: false,
      orderIndex: 0,
      content: "",
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục mới</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý danh mục sản phẩm lắp đặt chi tiết (Dòng sản phẩm thực tế).
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm danh mục
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sortedCategories}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm kiếm danh mục..."
      />

      <AdminDialog
        open={!!activeCategory}
        onOpenChange={(open) => !open && setActiveCategory(null)}
        title={activeCategory === "new" ? "Thêm danh mục" : "Sửa danh mục"}
        description="Quản lý chi tiết danh mục, ảnh đại diện và SEO."
        size="full"
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: General Info */}
                <div className="lg:col-span-8 space-y-6">
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Tên danh mục *</FieldLabel>
                        <Input
                          {...field}
                          onChange={(e) => {
                            onNameChange(e.target.value);
                            field.onChange(e);
                          }}
                          placeholder="VD: Máy lạnh treo tường"
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="groupId"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Thuộc nhóm sản phẩm</FieldLabel>
                        <Select
                          value={field.value || "none"}
                          onValueChange={(v) =>
                            field.onChange(v === "none" ? null : v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Không chọn nhóm" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Không chọn nhóm</SelectItem>
                            {groups.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="slug"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Slug / URL Preview</FieldLabel>
                        <Input {...field} placeholder="Tự động tạo nếu để trống" />
                        <FieldDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ArrowSquareOut size={12} />
                          /{field.value || "..."}
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

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
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <Field orientation="horizontal" className="justify-between items-center border px-3 py-2 rounded-xl self-end h-[42px] gap-2">
                          <FieldLabel className="font-normal text-xs whitespace-nowrap mb-0">Nổi bật</FieldLabel>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </Field>
                      )}
                    />
                  </div>
                </div>

                {/* Right Column: Image Upload */}
                <div className="lg:col-span-4 flex justify-start lg:justify-center">
                  <Controller
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <Field className="max-w-[240px] w-full">
                        <FieldLabel>Upload ảnh</FieldLabel>
                        <ImageUpload
                          value={field.value || ""}
                          onChange={field.onChange}
                          aspectRatio="1:1"
                          folderPath="categories"
                        />
                      </Field>
                    )}
                  />
                </div>
              </div>

              {/* SEO Section */}
              <div className="space-y-6 border p-6 rounded-2xl bg-muted/10">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-semibold tracking-tight">Cấu hình SEO</h3>
                  <p className="text-[11px] text-muted-foreground">Tối ưu hóa hiển thị trên các công cụ tìm kiếm (Google, Bing,...).</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    control={form.control}
                    name="metaTitle"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel className="text-xs">Tiêu đề SEO</FieldLabel>
                        <Input {...field} value={field.value || ""} placeholder="Để trống sẽ dùng tên danh mục..." />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="metaDescription"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel className="text-xs">Mô tả SEO</FieldLabel>
                        <Textarea {...field} value={field.value || ""} placeholder="Nhập mô tả tóm tắt..." className="min-h-[80px]" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>
              </div>

              {/* Editor Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">Bài viết chi tiết SEO</h3>
                    <p className="text-[11px] text-muted-foreground">Nội dung bài viết hiển thị ở cuối danh sách sản phẩm.</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tiptap Editor</span>
                </div>
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <TiptapEditor
                      key={activeCategory === "new" ? "new" : activeCategory?.id}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Bắt đầu viết bài viết tối ưu SEO tại đây..."
                      uploadImage={async (file) => {
                        const webpFile = await convertToWebP(file);
                        return uploadImageFile(webpFile, "categories", webpFile.name);
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
            <Button
              variant="outline"
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
        entityType="category"
        entityId={deletingId}
      />
    </div>
  );
}
