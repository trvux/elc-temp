"use client";

import { AdminDialog } from "@/components/admin/admin-dialog";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import { convertToWebP } from "@/lib/image";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const supabase = createClient();

  async function fetchData() {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");
    
    if (error) {
      toast.error("Lỗi khi tải danh sách thương hiệu");
      return;
    }
    setBrands(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const webpFile = await convertToWebP(file);
      const fileName = `brands/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });
      
      if (error) throw error;
      
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      setLogoUrl(data.publicUrl);
      toast.success("Đã tải logo lên thành công");
    } catch (error) {
      toast.error("Lỗi upload logo");
    } finally {
      setUploading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setLogoUrl(null);
    setDescription("");
    setOpen(true);
  }

  function openEdit(b: Brand) {
    setEditing(b);
    setName(b.name);
    setSlug(b.slug);
    setLogoUrl(b.logo_url);
    setDescription(b.description || "");
    setOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên thương hiệu");
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim() || generateSlug(name),
      logo_url: logoUrl,
      description: description.trim() || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("brands")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error(`Lỗi: ${error.message}`);
        return;
      }
      toast.success("Đã cập nhật thương hiệu");
    } else {
      const { error } = await supabase.from("brands").insert(payload);
      if (error) {
        toast.error(`Lỗi: ${error.message}`);
        return;
      }
      toast.success("Đã thêm thương hiệu mới");
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
    const { error } = await supabase.from("brands").delete().eq("id", deletingId);
    if (error) {
      toast.error("Lỗi xóa thương hiệu. Có thể vẫn còn sản phẩm thuộc hãng này.");
      return;
    }
    toast.success("Đã xóa thương hiệu");
    setDeleteOpen(false);
    fetchData();
  }

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: "logo_url",
      header: "Logo",
      cell: ({ row }) => (
        <div className="w-12 h-12 relative border border-border/40 rounded bg-white flex items-center justify-center p-1">
          {row.original.logo_url ? (
            <Image
              src={row.original.logo_url}
              alt={row.original.name}
              fill
              className="object-contain p-1"
            />
          ) : (
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">No Logo</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Tên thương hiệu",
    },
    {
      accessorKey: "slug",
      header: "Slug",
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(row.original)}>
            <Pencil size={14} />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => openDelete(row.original.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thương hiệu</h1>
          <p className="text-sm text-muted-foreground">Quản lý các hãng sản xuất và cung cấp sản phẩm.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Thêm thương hiệu
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={brands}
        searchKey="name"
        searchPlaceholder="Tìm kiếm thương hiệu..."
      />

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Sửa thương hiệu" : "Thêm thương hiệu"}
        description="Nhập thông tin hãng sản xuất."
      >
        <div className="space-y-6">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Field>
                  <FieldLabel>Tên thương hiệu *</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="VD: Daikin"
                      value={name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setName(val);
                        if (!editing) setSlug(generateSlug(val));
                      }}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Slug (Tự động)</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="vd: daikin"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </FieldContent>
                </Field>
              </div>

              <Field>
                <FieldLabel>Logo thương hiệu</FieldLabel>
                <FieldContent>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-full aspect-square border-2 border-dashed rounded-xl flex items-center justify-center bg-muted/20 relative overflow-hidden group">
                      {logoUrl ? (
                        <>
                          <Image src={logoUrl} alt="Logo" fill className="object-contain p-4" />
                          <button
                            onClick={() => setLogoUrl(null)}
                            className="absolute top-2 right-2 bg-background/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload size={24} />
                          <span className="text-xs">Chưa có logo</span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" className="w-full relative" disabled={uploading}>
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleUpload}
                      />
                      {uploading ? "Đang tải..." : "Tải logo lên"}
                    </Button>
                  </div>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel>Mô tả ngắn về hãng (Tùy chọn)</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="VD: Thương hiệu máy lạnh hàng đầu Nhật Bản"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu thông tin</Button>
          </div>
        </div>
      </AdminDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Xóa thương hiệu?"
        description="Hành động này không thể hoàn tác. Thương hiệu sẽ bị xóa vĩnh viễn khỏi hệ thống."
      />
    </div>
  );
}
