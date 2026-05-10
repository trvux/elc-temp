"use client";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldContent,
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

import { Category } from "@/modules/category/domain/types";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { convertToWebP } from "@/shared/lib/image";
import { createClient } from "@/shared/lib/supabase/client";
import { extractTitleFromHtml, generateSlug } from "@/shared/lib/utils";
import { ExternalLink, Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Json, ProjectWithCategory } from "../../domain";
import {
  createProjectAction,
  deleteProjectAction,
  getProjectsAction,
  updateProjectAction,
} from "../actions";
import { getColumns } from "./ProjectColumns";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { createProjectSchema } from "../../domain";

type ProjectFormValues = {
  title: string;
  slug: string;
  description: unknown;
  images: string[];
  isFeatured: boolean;
  isPublished: boolean;
  orderIndex: number;
  categoryId: string;
};

export function ProjectManagement() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Consolidate modal states
  const [activeProject, setActiveProject] = useState<
    ProjectWithCategory | "new" | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Filter states
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  const form = useForm<ProjectFormValues>({
    resolver: standardSchemaResolver(createProjectSchema as any) as any,
    defaultValues: {
      title: "",
      slug: "",
      description: null,
      categoryId: "",
      images: [],
      isPublished: true,
      isFeatured: false,
      orderIndex: 0,
    } as ProjectFormValues,
  });

  // Fetch Data
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await getProjectsAction({
        includeDeleted: false,
      });
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

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      if (activeProject && activeProject !== "new") {
        return updateProjectAction({
          ...values,
          id: activeProject.id,
          description: values.description as Json,
        });
      }
      return createProjectAction({
        ...values,
        description: values.description as Json,
      });
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeProject === "new" ? "Đã tạo dự án" : "Đã cập nhật dự án",
      );
      setActiveProject(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

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

  const flattenedCategories = useMemo(() => {
    const result: (Category & { displayName: string; isParent: boolean })[] =
      [];
    const rootCategories = categories.filter(
      (c) => !c.parentId || !categories.find((p) => p.id === c.parentId),
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

  const filteredProjects = useMemo(() => {
    return enrichedProjects.filter((p) => {
      const matchCategory =
        filterCategoryId === "all" || p.categoryId === filterCategoryId;
      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? p.isPublished : !p.isPublished);
      return matchCategory && matchPublished;
    });
  }, [enrichedProjects, filterCategoryId, filterIsPublished]);

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
    [form],
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const webpFile = await convertToWebP(file);
        const fileName = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { error } = await supabase.storage
          .from("images")
          .upload(fileName, webpFile, { contentType: "image/webp" });
        if (error) throw error;
        const { data } = supabase.storage.from("images").getPublicUrl(fileName);
        uploaded.push(data.publicUrl);
      } catch (error) {
        toast.error(`Lỗi upload: ${file.name}`);
      }
    }
    const currentImages = form.getValues("images") || [];
    form.setValue("images", [...currentImages, ...uploaded]);
    setUploading(false);
    toast.success(`Đã upload ${uploaded.length} ảnh`);
  }

  return (
    <div className="container mx-auto py-8 px-4">
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

      <div className="flex flex-wrap items-center gap-4 mb-1">
        <div className="w-full md:w-auto">
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
        </div>
        <div className="w-full md:w-auto">
          <Select
            value={filterIsPublished}
            onValueChange={setFilterIsPublished}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="true">Đang hiển thị</SelectItem>
              <SelectItem value="false">Đang ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
        searchPlaceholder="Tìm kiếm tên, slug, danh mục..."
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
          className="space-y-8"
        >
          <FieldGroup>
            <div className="bg-muted/10 p-6 rounded-2xl border border-border/40 transition-colors hover:border-border/60">
              <h3 className="text-xs font-bold capitalize tracking-widest text-muted-foreground/60 mb-6">
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-12 lg:col-span-5">
                  <Field>
                    <FieldContent>
                      <Controller
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="w-[var(--radix-select-trigger-width)] max-h-80"
                            >
                              <ScrollArea className="h-full w-full">
                                {categories
                                  .filter((c) => !c.parentId)
                                  .map((parent) => {
                                    const children = categories.filter(
                                      (c) => c.parentId === parent.id,
                                    );
                                    return (
                                      <SelectGroup key={parent.id}>
                                        <SelectItem
                                          value={parent.id}
                                          className="font-bold text-foreground py-2 px-2 capitalize tracking-tight"
                                        >
                                          {parent.name}
                                        </SelectItem>
                                        {children.map((child) => (
                                          <SelectItem
                                            key={child.id}
                                            value={child.id}
                                            className="pl-6"
                                          >
                                            {child.name}
                                          </SelectItem>
                                        ))}
                                        <SelectSeparator />
                                      </SelectGroup>
                                    );
                                  })}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-12 lg:col-span-7">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Slug (Đường dẫn tinh gọn)
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <Input
                            className="font-mono text-sm"
                            placeholder="lap-may-lanh-nha-anh-tuan-q1"
                            {...field}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-12">
                  <div className="bg-white/50 border rounded-lg p-3 flex items-center gap-2">
                    <div className="text-[10px] bg-muted/50 px-2 py-0.5 rounded font-bold capitalize text-muted-foreground/70 shrink-0 select-none">
                      Xem trước URL
                    </div>
                    <a
                      href={`/du-an/${form.watch("slug") || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-muted-foreground truncate hover:text-primary hover:underline flex items-center gap-1 transition-colors"
                    >
                      /du-an/
                      <span className="text-primary font-bold">
                        {form.watch("slug") || "slug-du-an"}
                      </span>
                      <ExternalLink size={10} className="ml-1 opacity-50" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium">Mô tả dự án</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        const extractedTitle = extractTitleFromHtml(val);
                        form.setValue("title", extractedTitle);

                        // Auto-slug logic
                        let namePart = extractedTitle.toLowerCase();
                        const catId = form.getValues("categoryId");
                        const cat = categories.find((c) => c.id === catId);
                        if (cat) {
                          const catName = cat.name.toLowerCase();
                          const parentCat = categories.find(
                            (c) => c.id === cat.parentId,
                          );
                          const parentName = parentCat?.name.toLowerCase();

                          if (parentName && namePart.startsWith(parentName)) {
                            namePart = namePart.replace(parentName, "").trim();
                          }
                          if (catName && namePart.startsWith(catName)) {
                            namePart = namePart.replace(catName, "").trim();
                          }
                        }

                        if (
                          activeProject === "new" ||
                          !form.getValues("slug")
                        ) {
                          form.setValue("slug", generateSlug(namePart));
                        }
                      }}
                      placeholder="Viết nội dung dự án..."
                      uploadImage={async (file) => {
                        const ext = file.name.split(".").pop();
                        const fileName = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                        const { error } = await supabase.storage
                          .from("images")
                          .upload(fileName, file);
                        if (error) throw error;
                        const { data } = supabase.storage
                          .from("images")
                          .getPublicUrl(fileName);
                        return data.publicUrl;
                      }}
                    />
                  )}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="mb-2 font-medium">
                Hình ảnh dự án
              </FieldLabel>
              <FieldContent>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/20">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Upload size={24} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {uploading
                        ? "Đang xử lý..."
                        : "Nhấn để tải lên hoặc kéo thả"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 10MB (Có thể chọn nhiều)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>

                <Controller
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                      {(field.value || []).map((url: string, i: number) => (
                        <div
                          key={i}
                          className="relative group aspect-square ring-1 ring-muted rounded-lg overflow-hidden bg-muted/30"
                        >
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 200px"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
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
                  )}
                />
              </FieldContent>
            </Field>

            <div className="flex items-center justify-between border-t pt-8 pb-4">
              <div className="flex flex-wrap items-center gap-8">
                <Field
                  orientation="horizontal"
                  className="w-auto gap-3 flex items-center"
                >
                  <FieldLabel className="w-auto mb-0 font-medium">
                    Hiển thị
                  </FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Controller
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </FieldContent>
                </Field>
                <Field
                  orientation="horizontal"
                  className="w-auto gap-3 flex items-center"
                >
                  <FieldLabel className="w-auto mb-0 font-medium">
                    Nổi bật
                  </FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Controller
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </FieldContent>
                </Field>
                <Field
                  orientation="horizontal"
                  className="w-auto gap-3 flex items-center"
                >
                  <FieldLabel className="w-auto mb-0 font-medium h-full">
                    Thứ tự
                  </FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Controller
                      control={form.control}
                      name="orderIndex"
                      render={({ field }) => (
                        <Input
                          type="number"
                          className="w-20"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      )}
                    />
                  </FieldContent>
                </Field>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setActiveProject(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading
                    ? "Đang xử lý..."
                    : activeProject === "new"
                      ? "Tạo mới"
                      : "Cập nhật"}
                </Button>
              </div>
            </div>
          </FieldGroup>
        </form>
      </AdminDialog>

      <DeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}
