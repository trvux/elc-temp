"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type Category = { id: string; name: string };
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);

  const supabase = createClient();

  async function fetchData() {
    const [{ data: proj }, { data: cats }] = await Promise.all([
      supabase
        .from("projects")
        .select("*, categories(name)")
        .order("order_index"),
      supabase.from("categories").select("*").eq("type", "project"),
    ]);
    setProjects(proj || []);
    setCategories(cats || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setCategoryId("");
    setImages([]);
    setIsPublished(true);
    setOrderIndex(0);
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
    setOpen(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, file);
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
      toast.error("Nhập tên công trình");
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
      toast.success("Đã cập nhật công trình");
    } else {
      const { error } = await supabase.from("projects").insert(payload);
      if (error) {
        toast.error("Lỗi tạo mới");
        return;
      }
      toast.success("Đã tạo công trình");
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
    const { error } = await supabase.from("projects").delete().eq("id", deletingId);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Công trình</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Thêm công trình
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên công trình</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-400"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-400"
                >
                  Chưa có công trình nào
                </TableCell>
              </TableRow>
            ) : (
              projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.title}
                        width={60}
                        height={60}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-[60px] h-[60px] bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">
                        KHÔNG CÓ ẢNH
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.categories?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_published ? "default" : "secondary"}>
                      {p.is_published ? "Hiện" : "Ẩn"}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.order_index}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => openDelete(p.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        size="3xl"
        title={editing ? "Sửa công trình" : "Thêm công trình"}
        description="Quản lý chi tiết công trình, hình ảnh và SEO để thu hút khách hàng."
      >
        <div className="space-y-8">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2">Tên công trình *</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="VD: Lắp máy lạnh nhà anh Tuấn Q.1"
                    value={title}
                    onChange={(e) => {
                      const val = e.target.value;
                      const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                      setTitle(capitalized);
                      if (!editing) setSlug(generateSlug(capitalized));
                    }}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="mb-2">Slug (URL)</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="lap-may-lanh-nha-anh-tuan-q1"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <FieldDescription>URL: /cong-trinh/{slug || 'slug'}</FieldDescription>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2">Danh mục</FieldLabel>
              <FieldContent>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full md:w-1/2">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="mb-2">Mô tả công trình</FieldLabel>
              <FieldContent>
                <TiptapEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Mô tả công trình..."
                  uploadImage={async (file) => {
                    const ext = file.name.split(".").pop();
                    const fileName = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                    const { error } = await supabase.storage.from("images").upload(fileName, file);
                    if (error) throw error;
                    const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                    return data.publicUrl;
                  }}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="mb-2">Hình ảnh công trình</FieldLabel>
              <FieldContent>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/20">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Upload size={24} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {uploading ? "Đang xử lý..." : "Nhấn để tải lên hoặc kéo thả"}
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
                      <div key={i} className="relative group aspect-square ring-1 ring-muted rounded-lg overflow-hidden bg-muted/30">
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => setImages(images.filter((_, idx) => idx !== i))}
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

            <div className="flex items-center justify-between border-t pt-6">
              <div className="flex items-center gap-8">
                <Field orientation="horizontal" className="w-auto">
                  <FieldLabel className="w-auto">Hiển thị</FieldLabel>
                  <FieldContent>
                    <Switch
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </FieldContent>
                </Field>
                <Field orientation="horizontal" className="w-auto">
                  <FieldLabel className="w-auto">Thứ tự</FieldLabel>
                  <FieldContent>
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
                <Button onClick={handleSave} className="min-w-[120px]">
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
