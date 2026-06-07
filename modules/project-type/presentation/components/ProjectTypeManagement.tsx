"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { ImageUpload } from "@/shared/components/ui/image-upload";

import { ProjectTypeWithCategories } from "../../domain";
import { deleteProjectTypeAction, getProjectTypesAction } from "../actions";
import { useProjectTypeForm } from "../hooks/useProjectTypeForm";
import { getColumns } from "./columns";

export function ProjectTypeManagement() {
  const queryClient = useQueryClient();
  const [activeProjectType, setActiveProjectType] = useState<ProjectTypeWithCategories | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Service Types
  const { data: projectTypes = [], isLoading } = useQuery({
    queryKey: ["project-types"],
    queryFn: async () => {
      const { data, error } = await getProjectTypesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Fetch Categories for Selection
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-new"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data;
    },
  });
  // Form Hook
  const { form, saveMutation, handleUpload, uploading, onNameChange } = useProjectTypeForm(activeProjectType, () =>
    setActiveProjectType(null)
  );

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProjectTypeAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa loại hình công trình");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["project-types"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (st) => {
          setActiveProjectType(st);
          form.reset({
            name: st.name,
            slug: st.slug || "",
            image: st.image || "",
            metaTitle: st.metaTitle || "",
            metaDescription: st.metaDescription || "",
            isFeatured: !!st.isFeatured,
            orderIndex: st.orderIndex || 0,
            categoryIds: (st.categories || []).map((c) => c.id),
          });
        },
        onDelete: (id) => {
          setDeletingId(id);
        },
      }),
    [form]
  );

  function openCreate() {
    setActiveProjectType("new");
    form.reset({
      name: "",
      slug: "",
      image: "",
      metaTitle: "",
      metaDescription: "",
      isFeatured: false,
      orderIndex: 0,
      categoryIds: [],
    });
  }

  // Group categories for rendering checkboxes
  const groupedCategories = useMemo(() => {
    const grouped: Record<string, typeof categories> = {};
    categories.forEach((cat) => {
      const groupName = cat.group?.name || "Khác";
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(cat);
    });
    return grouped;
  }, [categories]);

  const selectedCategoryIds = form.watch("categoryIds") || [];

  const handleToggleCategory = (catId: string) => {
    const current = [...selectedCategoryIds];
    const idx = current.indexOf(catId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(catId);
    }
    form.setValue("categoryIds", current, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loại hình công trình</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các loại hình công trình (Villa, Biệt thự...) và liên kết các dòng sản phẩm phù hợp.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm loại hình
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={projectTypes}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm kiếm loại hình..."
      />

      <AdminDialog
        open={!!activeProjectType}
        onOpenChange={(open) => !open && setActiveProjectType(null)}
        title={activeProjectType === "new" ? "Thêm loại hình công trình" : "Sửa loại hình công trình"}
        description="Nhập thông tin loại hình và chọn các dòng sản phẩm liên kết (nhiều - nhiều)."
        size="full"
      >
        <Tabs defaultValue="info" className="flex flex-col flex-1 min-h-0 relative w-full">
          {/* Centered Sticky Header Tabs */}
          <div className="flex sticky top-0 z-20 w-full items-center justify-center border-b bg-background/95 py-4 backdrop-blur">
            <TabsList>
              <TabsTrigger value="info">Thông tin chung</TabsTrigger>
              <TabsTrigger value="seo">Cấu hình SEO</TabsTrigger>
            </TabsList>
          </div>

          <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col min-h-0">
            <form
              onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
              className="flex-1 flex flex-col min-h-0 w-full"
            >
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                {/* Tab 1: Cấu hình chung */}
                <TabsContent value="info" className="mt-0 focus-visible:outline-none space-y-12 pb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Config parameters */}
                    <div className="lg:col-span-4 space-y-6">
                      <Controller
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Tên loại hình công trình *</FieldLabel>
                            <Input
                              {...field}
                              placeholder="VD: Biệt thự, Villa, Nhà xưởng"
                              onChange={(e) => onNameChange(e.target.value)}
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
                            <FieldLabel>Đường dẫn (Slug) *</FieldLabel>
                            <Input {...field} placeholder="auto-generated-slug" />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />

                      <Controller
                        control={form.control}
                        name="orderIndex"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Thứ tự hiển thị</FieldLabel>
                            <Input type="number" {...field} />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />

                      <Controller
                        control={form.control}
                        name="isFeatured"
                        render={({ field, fieldState }) => (
                          <Field>
                            <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/10">
                              <div className="space-y-0.5">
                                <FieldLabel className="text-sm font-semibold tracking-tight">Nổi bật</FieldLabel>
                                <span className="text-xs text-muted-foreground block">Hiện trang chủ</span>
                              </div>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </div>
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />

                      {/* Image Upload for SEO */}
                      <Controller
                        control={form.control}
                        name="image"
                        render={({ field, fieldState }) => (
                          <Field className="max-w-[280px] w-full">
                            <FieldLabel>Upload ảnh</FieldLabel>
                            <ImageUpload
                              value={field.value || ""}
                              onChange={field.onChange}
                              aspectRatio="16:9"
                              folderPath="project-types"
                            />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                    </div>

                    {/* Right Column: Relations selection */}
                    <div className="lg:col-span-8 space-y-6">
                      <Field className="flex flex-col gap-3">
                        <FieldLabel className="text-sm font-semibold tracking-tight block">
                          Dòng sản phẩm liên kết (Nhóm danh mục → Danh mục chi tiết)
                        </FieldLabel>
                        <div className="space-y-4 mt-2">
                          {Object.keys(groupedCategories).length === 0 ? (
                            <span className="text-sm text-muted-foreground italic block">
                              Chưa có danh mục sản phẩm nào, vui lòng tạo danh mục trước.
                            </span>
                          ) : (
                            Object.entries(groupedCategories).map(([groupName, groupCats]) => (
                              <div key={groupName} className="border rounded-xl p-5 bg-muted/5 space-y-4">
                                <div>
                                  <h3 className="font-semibold text-xs text-foreground bg-muted border border-border px-2.5 py-1 rounded-md w-fit">
                                    {groupName}
                                  </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pl-1">
                                  {groupCats.map((cat) => (
                                    <label
                                      key={cat.id}
                                      className="flex items-center gap-3 text-sm font-medium text-foreground/80 cursor-pointer hover:text-primary transition-colors select-none p-3 border rounded-xl bg-background hover:bg-muted/30"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedCategoryIds.includes(cat.id)}
                                        onChange={() => handleToggleCategory(cat.id)}
                                        className="h-4.5 w-4.5 rounded-md border-input text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                                      />
                                      <span className="leading-tight">{cat.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </Field>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Cấu hình SEO */}
                <TabsContent value="seo" className="mt-0 focus-visible:outline-none space-y-6 pb-8">
                  <div className="max-w-2xl space-y-6">
                    <Controller
                      control={form.control}
                      name="metaTitle"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>SEO Title</FieldLabel>
                          <Input {...field} value={field.value || ""} placeholder="Nhập tiêu đề SEO..." />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="metaDescription"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>SEO Description</FieldLabel>
                          <Textarea {...field} value={field.value || ""} placeholder="Nhập mô tả SEO..." className="min-h-[120px]" />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </div>
                </TabsContent>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setActiveProjectType(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? "Đang lưu..."
                    : activeProjectType === "new"
                      ? "Tạo loại hình"
                      : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </div>
        </Tabs>
      </AdminDialog>

      <DeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
        entityType="project-type"
        entityId={deletingId}
      />
    </div>
  );
}
