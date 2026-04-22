"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { convertToWebP } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, type NewsRow } from "./columns";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
  FieldGroup,
} from "@/components/ui/field";
import { Pencil, Trash2, Plus, ChevronDown, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { extractTitleFromHtml, generateSlug } from "@/lib/utils";
import Image from "next/image";

type News = {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: string | null;
  is_published: boolean;
  order_index: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
};


export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<News | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [filterPublished, setFilterPublished] = useState<string>("all");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const supabase = createClient();

  async function fetchNews() {
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("order_index", { ascending: true });
    setNewsList(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchNews();
  }, []);

  const filteredNews = useMemo(() => {
    return newsList.filter((n) => {
      const matchPublished =
        filterPublished === "all" ||
        (filterPublished === "true" ? n.is_published : !n.is_published);
      return matchPublished;
    });
  }, [newsList, filterPublished]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (n) => openEdit(n as unknown as News),
        onDelete: openDelete,
      }),
    [newsList],
  );

  function openCreate() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setContent("");
    setImage(null);
    setIsPublished(true);
    setOrderIndex(0);
    setMetaTitle("");
    setMetaDescription("");
    setSeoOpen(false);
    setOpen(true);
  }

  function openEdit(n: News) {
    setEditing(n);
    setTitle(n.title);
    setSlug(n.slug);
    
    // Migration: If content doesn't have an H1, prepend the existing title
    // Only applies to legacy HTML string content
    const contentBody = n.content || "";
    if (typeof contentBody === "string" && !contentBody.includes("<h1") && n.title) {
      setContent(`<h1>${n.title}</h1>${contentBody}`);
    } else {
      setContent(contentBody);
    }

    setImage(n.image);
    setIsPublished(n.is_published);
    setOrderIndex(n.order_index);
    setMetaTitle(n.meta_title || "");
    setMetaDescription(n.meta_description || "");
    setSeoOpen(!!(n.meta_title || n.meta_description));
    setOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const webpFile = await convertToWebP(file);
      const fileName = `news/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });
      
      if (error) throw error;

      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      setImage(data.publicUrl);
      toast.success("Đã tải lên ảnh đại diện");
    } catch (error) {
      toast.error("Lỗi tải ảnh");
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Nhập tiêu đề tin tức");
      return;
    }
    if (!slug.trim()) {
      toast.error("Nhập slug");
      return;
    }

    const payload = {
      title,
      slug: slug.trim(),
      content,
      image,
      is_published: isPublished,
      order_index: orderIndex,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase
        .from("news")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error(
          error.message.includes("unique") ? "Slug đã tồn tại" : "Lỗi cập nhật",
        );
        return;
      }
      toast.success("Đã cập nhật tin tức");
    } else {
      const { error } = await supabase.from("news").insert(payload);
      if (error) {
        toast.error(
          error.message.includes("unique")
            ? "Slug đã tồn tại"
            : "Lỗi tạo tin tức",
        );
        return;
      }
      toast.success("Đã tạo tin tức");
    }

    setOpen(false);
    fetchNews();
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", deletingId);
    if (error) {
      toast.error("Lỗi xóa");
      return;
    }
    toast.success("Đã xóa");
    setDeleteOpen(false);
    fetchNews();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tin tức</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các bài viết tin tức hiển thị tại /tin-tuc/[slug]
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} className="mr-2" /> Tạo tin tức mới
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="w-full md:w-auto">
          <Select value={filterPublished} onValueChange={setFilterPublished}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="true">Đang hiển thị</SelectItem>
              <SelectItem value="false">Đang ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filterPublished !== "all" && (
          <Button
            variant="ghost"
            onClick={() => setFilterPublished("all")}
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredNews}
        searchKey="title"
        searchPlaceholder="Tìm kiếm tiêu đề, slug..."
      />

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        size="full"
        title={editing ? `Sửa: ${editing.title}` : "Tạo tin tức mới"}
        description="Quản lý nội dung tin tức và cấu hình SEO để tối ưu hóa hiển thị."
      >
        <div className="space-y-8">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tiêu đề tin tức field removed as it's now handled by the editor H1 */}

              <Field className="md:col-span-2">
                <FieldLabel className="mb-2 font-medium">
                  Slug (URL) *
                </FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="khai-truong-chi-nhanh-moi"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <FieldDescription>
                    Đường dẫn:{" "}
                    <span className="font-medium text-primary">
                      /tin-tuc/{slug || "slug"}
                    </span>
                  </FieldDescription>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium">
                Ảnh đại diện (Thumbnail)
              </FieldLabel>
              <FieldContent>
                <div className="flex flex-col gap-4">
                  {image ? (
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden border">
                      <Image src={image} alt="Thumbnail" fill className="object-cover" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setImage(null)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-40 aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload size={20} className="text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">{uploading ? "Đang tải..." : "Tải ảnh lên"}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="mb-2 font-medium">
                Nội dung tin tức
              </FieldLabel>
              <FieldContent>
                <TiptapEditor
                  value={content}
                  onChange={(val) => {
                    setContent(val);
                    const extractedTitle = extractTitleFromHtml(val);
                    setTitle(extractedTitle);
                    setSlug(generateSlug(extractedTitle));
                  }}
                  placeholder="Viết nội dung tin tức..."
                  uploadImage={async (file) => {
                    const webpFile = await convertToWebP(file);
                    const fileName = `news/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
                    const { error } = await supabase.storage
                      .from("images")
                      .upload(fileName, webpFile, { contentType: "image/webp" });
                    if (error) throw error;
                    const { data } = supabase.storage
                      .from("images")
                      .getPublicUrl(fileName);
                    return data.publicUrl;
                  }}
                />
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
                  className={`transition-transform duration-200 ${seoOpen ? "rotate-180" : ""}`}
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
                    <Textarea
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
                    Công khai
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
                  {editing ? "Cập nhật tin tức" : "Tạo tin tức ngay"}
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
