"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { getColumns } from "./columns";
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
import { Pencil, Trash2, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { TiptapEditor } from "@/components/ui/tiptap-editor";

type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
};

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

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterPublished, setFilterPublished] = useState<string>("all");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const supabase = createClient();

  async function fetchPages() {
    const { data } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false });
    setPages(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchPages();
  }, []);

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      const matchPublished =
        filterPublished === "all" ||
        (filterPublished === "true" ? p.is_published : !p.is_published);
      return matchPublished;
    });
  }, [pages, filterPublished]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (p) => openEdit(p as unknown as Page),
        onDelete: openDelete,
      }),
    [pages],
  );

  function openCreate() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setContent("");
    setIsPublished(true);
    setMetaTitle("");
    setMetaDescription("");
    setSeoOpen(false);
    setOpen(true);
  }

  function openEdit(p: Page) {
    setEditing(p);
    setTitle(p.title);
    setSlug(p.slug);
    setContent(p.content || "");
    setIsPublished(p.is_published);
    setMetaTitle(p.meta_title || "");
    setMetaDescription(p.meta_description || "");
    setSeoOpen(!!(p.meta_title || p.meta_description));
    setOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Nhập tiêu đề trang");
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
      is_published: isPublished,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase
        .from("pages")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error(
          error.message.includes("unique") ? "Slug đã tồn tại" : "Lỗi cập nhật",
        );
        return;
      }
      toast.success("Đã cập nhật trang");
    } else {
      const { error } = await supabase.from("pages").insert(payload);
      if (error) {
        toast.error(
          error.message.includes("unique")
            ? "Slug đã tồn tại"
            : "Lỗi tạo trang",
        );
        return;
      }
      toast.success("Đã tạo trang");
    }

    setOpen(false);
    fetchPages();
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    const { error } = await supabase
      .from("pages")
      .delete()
      .eq("id", deletingId);
    if (error) {
      toast.error("Lỗi xóa");
      return;
    }
    toast.success("Đã xóa");
    setDeleteOpen(false);
    fetchPages();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trang tĩnh</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý nội dung các trang thông tin, chính sách và giới thiệu.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} className="mr-2" /> Tạo trang mới
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
        data={filteredPages}
        searchKey="title"
        searchPlaceholder="Tìm kiếm tiêu đề, slug..."
      />

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        size="3xl"
        title={editing ? `Sửa: ${editing.title}` : "Tạo trang mới"}
        description="Quản lý nội dung trang tĩnh và cấu hình SEO để tối ưu hóa hiển thị."
      >
        <div className="space-y-8">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2 font-medium">
                  Tiêu đề trang *
                </FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="VD: Về chúng tôi"
                    value={title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTitle(val);
                      if (!editing) setSlug(generateSlug(val));
                    }}
                  />
                  <FieldDescription>
                    Tiêu đề chính hiển thị trên bài viết.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="mb-2 font-medium">
                  Slug (URL) *
                </FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="ve-chung-toi"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <FieldDescription>
                    Đường dẫn:{" "}
                    <span className="font-medium text-primary">
                      /{slug || "slug"}
                    </span>
                  </FieldDescription>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium">
                Nội dung trang
              </FieldLabel>
              <FieldContent>
                <TiptapEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Viết nội dung trang..."
                  uploadImage={async (file) => {
                    const ext = file.name.split(".").pop();
                    const fileName = `pages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
              <Field
                orientation="horizontal"
                className="w-auto gap-3 flex items-center"
              >
                <FieldLabel className="w-auto mb-0 font-medium">
                  Hiển thị công khai
                </FieldLabel>
                <FieldContent className="flex items-center min-h-0">
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </FieldContent>
              </Field>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave}>
                  {editing ? "Cập nhật trang" : "Tạo trang ngay"}
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
