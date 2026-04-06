"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

  async function handleDelete(id: string) {
    if (!confirm("Xóa trang này?")) return;
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) {
      toast.error("Lỗi xóa");
      return;
    }
    toast.success("Đã xóa");
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
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => handleDelete(p.id)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Sửa: ${editing.title}` : "Tạo trang mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input
                placeholder="VD: Về chúng tôi"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editing) setSlug(generateSlug(e.target.value));
                }}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>Slug (URL) *</Label>
              <Input
                placeholder="ve-chung-toi"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                URL công khai:{" "}
                <span className="text-gray-600 font-mono">
                  /{slug || "slug"}
                </span>
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <TiptapEditor
                value={content}
                onChange={setContent}
                placeholder="Viết nội dung trang..."
                uploadImage={async (file) => {
                  const ext = file.name.split(".").pop();
                  const fileName = `pages/${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}.${ext}`;
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
            </div>

            {/* Published */}
            <div className="flex items-center gap-3">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <Label>Hiển thị công khai</Label>
            </div>

            {/* SEO — collapsible */}
            <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors w-full">
                <ChevronDown
                  size={16}
                  className={`transition-transform ${seoOpen ? "rotate-180" : ""}`}
                />
                SEO (tuỳ chọn)
                {(metaTitle || metaDescription) && (
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    Đã cấu hình
                  </span>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3 border rounded-lg p-4 bg-gray-50">
                <div className="space-y-2">
                  <Label className="text-sm">
                    Meta Title{" "}
                    <span className="text-gray-400 font-normal">
                      (mặc định = tiêu đề trang)
                    </span>
                  </Label>
                  <Input
                    placeholder={title || "Tiêu đề hiển thị trên Google"}
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-400">
                    {metaTitle.length}/60 ký tự
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Meta Description</Label>
                  <Textarea
                    placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm..."
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-400">
                    {metaDescription.length}/160 ký tự
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button className="w-full" onClick={handleSave}>
              {editing ? "Cập nhật" : "Tạo trang"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
