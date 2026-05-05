"use client";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Switch } from "@/shared/components/ui/switch";

import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { convertToWebP } from "@/shared/lib/image";
import { createClient } from "@/shared/lib/supabase/client";
import { Category } from "@/modules/category/domain/types";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { capitalize, cn, extractTitleFromHtml, generateSlug } from "@/shared/lib/utils";
import { Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectWithCategory, CreateProjectInput, UpdateProjectInput } from "../../domain";
import { 
  getProjectsAction, 
  createProjectAction, 
  updateProjectAction, 
  deleteProjectAction 
} from "../actions";
import { getColumns } from "./ProjectColumns";

export function ProjectManagement() {
  const [projects, setProjects] = useState<ProjectWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectWithCategory | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter states
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState<any>(null);
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [orderIndex, setOrderIndex] = useState(0);

  const supabase = createClient();

  async function fetchData() {
    setLoading(true);
    try {
      const [projRes, catsRes] = await Promise.all([
        getProjectsAction({ includeDeleted: false }),
        getCategoriesAction("PROJECT"),
      ]);

      const proj = projRes.data || [];
      const categoriesList = catsRes.data || [];
      
      // Enrich projects with path for display if needed
      const enrichedProj = proj.map((p) => {
        if (!p.categoryId) return p;
        
        // Find category in the list (including those not fetched if we only get PROJECT ones)
        // Actually, categoriesList only has PROJECT ones. 
        // If the project's category is not in the list, we can't show the path.
        const cat = categoriesList.find((c) => c.id === p.categoryId);
        if (!cat) return p;

        if (cat.parentId) {
          const parent = categoriesList.find((c) => c.id === cat.parentId);
          if (parent) {
            return {
              ...p,
              category: {
                ...p.category,
                id: cat.id,
                name: `${parent.name} > ${cat.name}`,
                slug: cat.slug,
              },
            };
          }
        }
        return p;
      });

      setProjects(enrichedProj);
      setCategories(categoriesList);
    } catch (error) {
      console.error("fetchData error:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    fetchData();
  }, []);

  const flattenedCategories = useMemo(() => {
    const result: (Category & { displayName: string; isParent: boolean })[] = [];
    
    // Tìm các danh mục gốc
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
    return projects.filter((p) => {
      const matchCategory =
        filterCategoryId === "all" || p.categoryId === filterCategoryId;
      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? p.isPublished : !p.isPublished);
      return matchCategory && matchPublished;
    });
  }, [projects, filterCategoryId, filterIsPublished]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (p) => openEdit(p),
        onDelete: openDelete,
      }),
    [projects],
  );

  function openCreate() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setDescription(null);
    setCategoryId("");
    setImages([]);
    setIsPublished(true);
    setIsFeatured(false);
    setOrderIndex(0);
    setOpen(true);
  }

  function openEdit(p: ProjectWithCategory) {
    setEditing(p);
    setTitle(p.title);
    setSlug(p.slug || "");
    
    // Migration logic from old HTML content if necessary
    const content = p.description;
    if (typeof content === "string" && !content.includes("<h1") && p.title) {
      setDescription(`<h1>${p.title}</h1>${content}`);
    } else {
      setDescription(content);
    }

    setCategoryId(p.categoryId || "");
    setImages(p.images || []);
    setIsPublished(p.isPublished);
    setIsFeatured(p.isFeatured || false);
    setOrderIndex(p.orderIndex);
    setOpen(true);
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

    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    toast.success(`Đã upload ${uploaded.length} ảnh`);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Nhập tên dự án");
      return;
    }
    if (!categoryId) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    const baseInput = {
      title,
      slug,
      description,
      categoryId,
      images,
      isPublished,
      isFeatured,
      orderIndex,
    };

    if (editing) {
      const { error } = await updateProjectAction({
        ...baseInput,
        id: editing.id,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Đã cập nhật dự án");
    } else {
      const { error } = await createProjectAction(baseInput);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Đã tạo dự án");
    }

    setOpen(false);
    fetchData();
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    const { error } = await deleteProjectAction(deletingId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Đã xóa");
    setDeleteOpen(false);
    fetchData();
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
        searchKey="title"
        searchPlaceholder="Tìm kiếm tên, slug, danh mục..."
      />

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        size="full"
        title={editing ? "Sửa dự án" : "Thêm dự án"}
        description="Quản lý chi tiết dự án, hình ảnh và hiển thị."
      >
        <div className="space-y-8">
          <FieldGroup>
            <div className="bg-muted/10 p-6 rounded-2xl border border-border/40 transition-colors hover:border-border/60">
              <h3 className="text-xs font-bold capitalize tracking-widest text-muted-foreground/60 mb-6">
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-12 lg:col-span-5">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Danh mục
                    </FieldLabel>
                    <FieldContent>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>

                        <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-h-80">
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
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-12 lg:col-span-7">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Slug (Đường dẫn tinh gọn)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        className="font-mono text-sm"
                        placeholder="lap-may-lanh-nha-anh-tuan-q1"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-12">
                  <div className="bg-white/50 border rounded-lg p-3 flex items-center gap-2">
                    <div className="text-[10px] bg-muted/50 px-2 py-0.5 rounded font-bold capitalize text-muted-foreground/70 shrink-0 select-none">
                      Xem trước URL
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      /du-an/
                      <span className="text-primary font-medium">
                        {(() => {
                          const cat = categories.find(
                            (c) => c.id === categoryId,
                          );
                          return cat?.slug ? `${cat.slug}/` : "";
                        })()}
                      </span>
                      <span className="text-primary font-bold">
                        {slug || "slug-du-an"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium">Mô tả dự án</FieldLabel>
              <FieldContent>
                <TiptapEditor
                  value={description}
                  onChange={(val) => {
                    setDescription(val);
                    const extractedTitle = extractTitleFromHtml(val);
                    setTitle(extractedTitle);
                    
                    // Auto-slug logic
                    let namePart = extractedTitle.toLowerCase();
                    const cat = categories.find((c) => c.id === categoryId);
                    if (cat) {
                      const catName = cat.name.toLowerCase();
                      const parentCat = categories.find((c) => c.id === cat.parentId);
                      const parentName = parentCat?.name.toLowerCase();

                      if (parentName && namePart.startsWith(parentName)) {
                        namePart = namePart.replace(parentName, "").trim();
                      }
                      if (catName && namePart.startsWith(catName)) {
                        namePart = namePart.replace(catName, "").trim();
                      }
                    }
                    
                    if (!editing || !slug) {
                      setSlug(generateSlug(namePart));
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

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                    {images.map((url, i) => (
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
                            onClick={() =>
                              setImages(images.filter((_, idx) => idx !== i))
                            }
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    <Switch
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
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
                    <Switch
                      checked={isFeatured}
                      onCheckedChange={setIsFeatured}
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
                    <Input
                      type="number"
                      className="w-20"
                      value={orderIndex}
                      onChange={(e) => setOrderIndex(Number(e.target.value))}
                    />
                  </FieldContent>
                </Field>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave}>
                  {editing ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </div>
          </FieldGroup>
        </div>
      </AdminDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}
