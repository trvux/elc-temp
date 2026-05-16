"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, Upload, X } from "lucide-react";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";

import { Category } from "@/modules/category/domain/types";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { ProjectWithCategory } from "../../domain";
import { deleteProjectAction, getProjectsAction } from "../actions";
import { getColumns } from "./ProjectColumns";
import { useProjectForm } from "../hooks/useProjectForm";

export function ProjectManagement() {
  const queryClient = useQueryClient();
  const [activeProject, setActiveProject] = useState<ProjectWithCategory | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  // Fetch Data
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await getProjectsAction({ includeDeleted: false });
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "PROJECT"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction("PROJECT");
      if (error) throw new Error(error);
      return data;
    },
  });

  // Custom Form Hook
  const {
    form,
    saveMutation,
    handleUpload,
    uploading,
    handleDescriptionChange,
    supabase,
  } = useProjectForm(activeProject, () => setActiveProject(null), categories);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProjectAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa dự án");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const enrichedProjects = useMemo(() => {
    return projects.map((p) => {
      if (!p.categoryId) return p;
      const cat = categories.find((c) => c.id === p.categoryId);
      if (!cat) return p;
      if (cat.parentId) {
        const parent = categories.find((c) => c.id === cat.parentId);
        if (parent) {
          return {
            ...p,
            category: {
              ...p.category,
              id: cat.id,
              name: `${parent.name} / ${cat.name}`,
              slug: cat.slug,
            },
          } as ProjectWithCategory;
        }
      }
      return p;
    });
  }, [projects, categories]);

  const filteredProjects = useMemo(() => {
    return enrichedProjects.filter((p) => {
      const matchCategory = filterCategoryId === "all" || p.categoryId === filterCategoryId;
      const matchPublished = filterIsPublished === "all" || (filterIsPublished === "true" ? p.isPublished : !p.isPublished);
      return matchCategory && matchPublished;
    });
  }, [enrichedProjects, filterCategoryId, filterIsPublished]);

  const flattenedCategories = useMemo(() => {
    const result: (Category & { displayName: string; isParent: boolean })[] = [];
    const rootCategories = categories.filter(
      (c) => !c.parentId || !categories.find((p) => p.id === c.parentId)
    );

    const processCategory = (cat: Category, level: number) => {
      result.push({
        ...cat,
        displayName: level > 0 ? `${"↳ ".repeat(level)}${cat.name}` : cat.name,
        isParent: level === 0,
      });
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
        onEdit: (p) => {
          setActiveProject(p);
          form.reset({
            title: p.title,
            slug: p.slug || "",
            description: p.description,
            categoryId: p.categoryId || "",
            images: p.images || [],
            isPublished: p.isPublished,
            isFeatured: p.isFeatured || false,
            orderIndex: p.orderIndex,
          });
        },
        onDelete: setDeletingId,
      }),
    [form]
  );

  function openCreate() {
    setActiveProject("new");
    form.reset({
      title: "",
      slug: "",
      description: null,
      categoryId: "",
      images: [],
      isPublished: true,
      isFeatured: false,
      orderIndex: 0,
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dự án</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý danh sách các dự án đã thực hiện.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm dự án
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {flattenedCategories.map((c) => (
              <SelectItem
                key={c.id}
                value={c.id}
                className={c.isParent ? "font-bold" : "pl-6"}
              >
                {c.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterIsPublished} onValueChange={setFilterIsPublished}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hiển thị</SelectItem>
            <SelectItem value="false">Đang ẩn</SelectItem>
          </SelectContent>
        </Select>

        {(filterCategoryId !== "all" || filterIsPublished !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterCategoryId("all");
              setFilterIsPublished("all");
            }}
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredProjects}
        isLoading={isProjectsLoading}
        searchKey="title"
        searchPlaceholder="Tìm kiếm tên dự án..."
      />

      <AdminDialog
        open={!!activeProject}
        onOpenChange={(open) => !open && setActiveProject(null)}
        size="full"
        title={activeProject === "new" ? "Thêm dự án" : "Sửa dự án"}
        description="Quản lý chi tiết dự án, hình ảnh và hiển thị."
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-5xl mx-auto space-y-12">
              {/* Common Info Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <Controller
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Danh mục dự án</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-80">
                            <ScrollArea className="h-full">
                              {categories
                                .filter((c) => !c.parentId)
                                .map((parent) => (
                                  <SelectGroup key={parent.id}>
                                    <SelectItem value={parent.id} className="font-bold">
                                      {parent.name}
                                    </SelectItem>
                                    {categories
                                      .filter((c) => c.parentId === parent.id)
                                      .map((child) => (
                                        <SelectItem key={child.id} value={child.id} className="pl-6">
                                          {child.name}
                                        </SelectItem>
                                      ))}
                                    <SelectSeparator />
                                  </SelectGroup>
                                ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <Field orientation="horizontal" className="justify-between border p-3 rounded-xl">
                          <FieldLabel className="font-normal">Hiển thị</FieldLabel>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <Field orientation="horizontal" className="justify-between border p-3 rounded-xl">
                          <FieldLabel className="font-normal">Nổi bật</FieldLabel>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </Field>
                      )}
                    />
                  </div>

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
                </div>

                <div className="lg:col-span-8 space-y-6">
                  <Controller
                    control={form.control}
                    name="slug"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Slug / URL Preview</FieldLabel>
                        <Input {...field} placeholder="vd: lap-may-lanh-nha-anh-tuan" />
                        <FieldDescription className="flex items-center gap-2">
                          <ExternalLink size={12} />
                          /du-an/{field.value || "..."}
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Hình ảnh dự án ({field.value?.length || 0})</FieldLabel>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          <label className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/20">
                            <Upload size={20} className="text-muted-foreground" />
                            <span className="text-[10px] font-medium uppercase text-muted-foreground">Tải lên</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleUpload}
                              disabled={uploading}
                            />
                          </label>
                          {field.value?.map((url: string, i: number) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border bg-muted/20">
                              <Image src={url} alt="" fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => {
                                    const next = [...field.value];
                                    next.splice(i, 1);
                                    field.onChange(next);
                                  }}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Field>
                    )}
                  />
                </div>
              </div>

              {/* Editor Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold tracking-tight">Nội dung dự án</h3>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tiptap Editor</span>
                </div>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value}
                      onChange={handleDescriptionChange}
                      placeholder="Viết nội dung chi tiết dự án ở đây..."
                      uploadImage={async (file) => {
                        const fileName = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
                        const { error } = await supabase.storage
                          .from("images")
                          .upload(fileName, file, { contentType: "image/webp" });
                        if (error) throw error;
                        const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                        return data.publicUrl;
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
            <Button variant="outline" type="button" onClick={() => setActiveProject(null)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : activeProject === "new" ? "Tạo dự án" : "Lưu thay đổi"}
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
