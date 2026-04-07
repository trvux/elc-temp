"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
// Import the "Beautiful" Field components
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
  FieldGroup,
} from "@/components/ui/field";
import { Pencil, Trash2, Plus, ExternalLink, ChevronDown } from "lucide-react";
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
          error.message.includes("unique") ? "Slug đã tồn tại" : "Lỗi cập nhật"
        );
        return;
      }
      toast.success("Đã cập nhật trang");
    } else {
      const { error } = await supabase.from("pages").insert(payload);
      if (error) {
        toast.error(
          error.message.includes("unique") ? "Slug đã tồn tại" : "Lỗi tạo trang"
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
    const { error } = await supabase.from("pages").delete().eq("id", deletingId);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trang tĩnh</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các trang như Giới thiệu, Chính sách, Bảo hành...
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Tạo trang mới
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-28">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-400"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : pages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-400"
                >
                  Chưa có trang nào. Nhấn &quot;Tạo trang mới&quot; để bắt đầu.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <a
                      href={`/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      /{p.slug}
                      <ExternalLink size={12} />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_published ? "default" : "secondary"}>
                      {p.is_published ? "Hiển thị" : "Ẩn"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(p.created_at).toLocaleDateString("vi-VN")}
                  </TableCell>
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
        title={editing ? `Sửa: ${editing.title}` : "Tạo trang mới"}
        description="Quản lý nội dung trang tĩnh và cấu hình SEO để tối ưu hóa hiển thị."
      >
        <div className="space-y-8">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2">Tiêu đề trang *</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="VD: Về chúng tôi"
                    value={title}
                    onChange={(e) => {
                      const val = e.target.value;
                      const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                      setTitle(capitalized);
                      if (!editing) setSlug(generateSlug(capitalized));
                    }}
                  />
                  <FieldDescription>Tiêu đề chính hiển thị trên bài viết.</FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="mb-2">Slug (URL) *</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="ve-chung-toi"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <FieldDescription>
                    Đường dẫn: <span className="font-medium text-primary">/{slug || "slug"}</span>
                  </FieldDescription>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2">Nội dung trang</FieldLabel>
              <FieldContent>
                <TiptapEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Viết nội dung trang..."
                  uploadImage={async (file) => {
                    const ext = file.name.split(".").pop();
                    const fileName = `pages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                    const { error } = await supabase.storage.from("images").upload(fileName, file);
                    if (error) throw error;
                    const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                    return data.publicUrl;
                  }}
                />
              </FieldContent>
            </Field>

            {/* SEO — collapsible */}
            <Collapsible open={seoOpen} onOpenChange={setSeoOpen} className="border rounded-xl overflow-hidden bg-muted/20">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold p-4 hover:bg-muted/30 transition-all w-full">
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${seoOpen ? "rotate-180" : ""}`}
                />
                Tối ưu hóa tìm kiếm (SEO Meta)
                {(metaTitle || metaDescription) && (
                  <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-600 border-green-500/20">
                    Đã cấu hình
                  </Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="p-6 pt-0 space-y-6">
                <Field>
                  <FieldLabel className="mb-2 font-normal text-muted-foreground">SEO Title</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder={title || "Tiêu đề hiển thị trên Google"}
                      value={metaTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMetaTitle(val.charAt(0).toUpperCase() + val.slice(1));
                      }}
                      maxLength={60}
                    />
                    <div className="flex justify-between mt-1 text-[10px] uppercase font-bold tracking-wider">
                      <span className="text-muted-foreground/60">Độ dài tiêu đề tối ưu (dưới 60)</span>
                      <span className={metaTitle.length > 60 ? "text-destructive" : "text-primary"}>{metaTitle.length}/60</span>
                    </div>
                  </FieldContent>
                </Field>
                
                <Field>
                  <FieldLabel className="mb-2 font-normal text-muted-foreground">SEO Description</FieldLabel>
                  <FieldContent>
                    <Textarea
                      placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm..."
                      value={metaDescription}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMetaDescription(val.charAt(0).toUpperCase() + val.slice(1));
                      }}
                      rows={3}
                      maxLength={160}
                    />
                    <div className="flex justify-between mt-1 text-[10px] uppercase font-bold tracking-wider">
                      <span className="text-muted-foreground/60">Mô tả ngắn gọn (dưới 160)</span>
                      <span className={metaDescription.length > 160 ? "text-destructive" : "text-primary"}>{metaDescription.length}/160</span>
                    </div>
                  </FieldContent>
                </Field>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex items-center justify-between border-t pt-8 pb-4">
              <Field orientation="horizontal" className="w-auto gap-3 flex items-center">
                <FieldLabel className="w-auto mb-0">Hiển thị công khai</FieldLabel>
                <FieldContent className="flex items-center min-h-0">
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </FieldContent>
              </Field>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} className="px-6">
                  Hủy
                </Button>
                <Button onClick={handleSave} className="min-w-[140px] px-6">
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
