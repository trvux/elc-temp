"use client";

import { AdminDialog } from "@/components/admin/admin-dialog";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DataTable } from "@/components/ui/data-table";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { convertToWebP } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { capitalize, cn } from "@/lib/utils";
import { ChevronDown, Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getColumns } from "./columns";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  slug: string;
};
type Project = {
  id: string;
  slug: string;
  title: string;
  description: string;
  images: string[];
  category_id: string;
  is_published: boolean;
  order_index: number;
  categories?: { name: string };
};

export default function ProjectsPage() {
  const [slug, setSlug] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter states
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [seoOpen, setSeoOpen] = useState(false);

  const supabase = createClient();

  async function fetchData() {
    const [{ data: proj }, { data: cats }] = await Promise.all([
      supabase
        .from("projects")
        .select("*, categories(name, parent_id)")
        .order("order_index"),
      supabase.from("categories").select("*").eq("type", "project"),
    ]);

    // Enrich projects with full category path for table display
    const enrichedProj = proj?.map((p) => {
      if (!p.categories || !p.category_id) return p;
      const cat = cats?.find((c) => c.id === p.category_id);
      if (cat?.parent_id) {
        const parent = cats?.find((c) => c.id === cat.parent_id);
        if (parent) {
          return {
            ...p,
            categories: {
              ...p.categories,
              name: `${parent.name} > ${cat.name}`,
            },
          };
        }
      }
      return p;
    });

    setProjects(enrichedProj || []);
    setCategories(cats || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const flattenedCategories = useMemo(() => {
    const result: (Category & { displayName: string; isParent: boolean })[] =
      [];
    const parents = categories.filter((c) => !c.parent_id);

    parents.forEach((parent) => {
      result.push({
        ...parent,
        displayName: parent.name,
        isParent: true,
      });

      const children = categories.filter((c) => c.parent_id === parent.id);
      children.forEach((child) => {
        result.push({
          ...child,
          displayName: `↳ ${child.name}`,
          isParent: false,
        });
      });
    });

    return result;
  }, [categories]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchCategory =
        filterCategoryId === "all" || p.category_id === filterCategoryId;
      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? p.is_published : !p.is_published);
      return matchCategory && matchPublished;
    });
  }, [projects, filterCategoryId, filterIsPublished]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (p) => openEdit(p as unknown as Project),
        onDelete: openDelete,
      }),
    [projects],
  );

  function openCreate() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setCategoryId("");
    setImages([]);
    setIsPublished(true);
    setOrderIndex(0);
    setMetaTitle("");
    setMetaDescription("");
    setSeoOpen(false);
    setOpen(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setTitle(p.title);
    setSlug(p.slug || "");
    setDescription(p.description || "");
    setCategoryId(p.category_id || "");
    setImages(p.images || []);
    setIsPublished(p.is_published);
    setOrderIndex(p.order_index);
    // @ts-ignore
    setMetaTitle(p.meta_title || "");
    // @ts-ignore
    setMetaDescription(p.meta_description || "");
    // @ts-ignore
    setSeoOpen(!!(p.meta_title || p.meta_description));
    setOpen(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const webpFile = await convertToWebP(file);
      const fileName = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });
      if (error) {
        toast.error(`Lỗi upload: ${file.name}`);
        continue;
      }
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      uploaded.push(data.publicUrl);
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

    const payload = {
      title,
      slug,
      description,
      category_id: categoryId || null,
      images,
      is_published: isPublished,
      order_index: orderIndex,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Lỗi cập nhật");
        return;
      }
      toast.success("Đã cập nhật dự án");
    } else {
      const { error } = await supabase.from("projects").insert(payload);
      if (error) {
        toast.error("Lỗi tạo mới");
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
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", deletingId);
    if (error) {
      toast.error("Lỗi xóa");
      return;
    }
    toast.success("Đã xóa");
    setDeleteOpen(false);
    fetchData();
  }
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
        size="3xl"
        title={editing ? "Sửa dự án" : "Thêm dự án"}
        description="Quản lý chi tiết dự án, hình ảnh và SEO để thu hút khách hàng."
      >
        <div className="space-y-8">
          <FieldGroup>
            <div className="bg-muted/10 p-6 rounded-2xl border border-border/40 transition-colors hover:border-border/60">
              <h3 className="text-xs font-bold capitalize tracking-widest text-muted-foreground/60 mb-6">
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-12">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Tên dự án *
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        placeholder="VD: Lắp máy lạnh nhà anh Tuấn Q.1"
                        value={title}
                        onChange={(e) => {
                          const val = e.target.value;
                          const capitalized = capitalize(val);
                          setTitle(capitalized);
                          setSlug(generateSlug(capitalized));
                        }}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-12 lg:col-span-5">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Danh mục
                    </FieldLabel>
                    <FieldContent>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((c) => !c.parent_id)
                            .map((parent) => {
                              const children = categories.filter(
                                (c) => c.parent_id === parent.id,
                              );
                              return (
                                <SelectGroup key={parent.id}>
                                  <SelectLabel className="font-bold text-foreground py-2 px-2 capitalize text-[10px] tracking-wider opacity-50">
                                    {parent.name}
                                  </SelectLabel>
                                  {children.length > 0 ? (
                                    children.map((child) => (
                                      <SelectItem
                                        key={child.id}
                                        value={child.id}
                                        className="pl-6"
                                      >
                                        {child.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="text-[10px] italic text-muted-foreground px-6 py-1">
                                      Chưa có danh mục con
                                    </div>
                                  )}
                                  <SelectSeparator />
                                </SelectGroup>
                              );
                            })}
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
                  onChange={setDescription}
                  placeholder="Mô tả dự án..."
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

            <Collapsible
              open={seoOpen}
              onOpenChange={setSeoOpen}
              className="border rounded-xl overflow-hidden bg-muted/20"
            >
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold p-4 hover:bg-muted/30 transition-all w-full">
                <ChevronDown
                  size={16}
                  className={cn(
                    "transition-transform duration-200",
                    seoOpen ? "rotate-180" : "",
                  )}
                />
                Tối ưu hóa tìm kiếm (SEO Meta)
                {(metaTitle || metaDescription) && (
                  <Badge
                    variant="outline"
                    className="ml-auto bg-primary/10 text-primary border-primary/20 font-bold capitalize text-[10px] tracking-widest px-2 py-0.5"
                  >
                    Đã cấu hình
                  </Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="p-6 pt-0 space-y-6">
                <Field>
                  <FieldLabel className="mb-2 font-semibold text-xs text-muted-foreground/60 capitalize tracking-widest">
                    SEO Title
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder={title || "Tiêu đề hiển thị trên Google"}
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      maxLength={60}
                    />
                    <div className="flex justify-between mt-1 text-[10px] capitalize font-bold tracking-wider">
                      <span className="text-muted-foreground/60">
                        Độ dài tiêu đề tối ưu (dưới 60)
                      </span>
                      <span
                        className={
                          metaTitle.length > 60
                            ? "text-destructive"
                            : "text-primary"
                        }
                      >
                        {metaTitle.length}/60
                      </span>
                    </div>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel className="mb-2 font-semibold text-xs text-muted-foreground/60 capitalize tracking-widest">
                    SEO Description
                  </FieldLabel>
                  <FieldContent>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm..."
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      rows={3}
                      maxLength={160}
                    />
                    <div className="flex justify-between mt-1 text-[10px] capitalize font-bold tracking-wider">
                      <span className="text-muted-foreground/60">
                        Mô tả ngắn gọn (dưới 160)
                      </span>
                      <span
                        className={
                          metaDescription.length > 160
                            ? "text-destructive"
                            : "text-primary"
                        }
                      >
                        {metaDescription.length}/160
                      </span>
                    </div>
                  </FieldContent>
                </Field>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex items-center justify-between border-t pt-8 pb-4">
              <div className="flex items-center gap-8">
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
