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
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  maps_url: string;
  maps_embed: string;
  description: string;
  is_published: boolean;
  order_index: number;
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

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [mapsEmbed, setMapsEmbed] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);

  const supabase = createClient();

  async function fetchBranches() {
    const { data } = await supabase
      .from("branches")
      .select("*")
      .order("order_index");
    setBranches(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  function handleNameChange(val: string) {
    const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
    setName(capitalized);
    if (!editing) setSlug(generateSlug(capitalized));
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setAddress("");
    setPhone("");
    setEmail("");
    setMapsUrl("");
    setMapsEmbed("");
    setDescription("");
    setIsPublished(true);
    setOrderIndex(0);
    setOpen(true);
  }

  function openEdit(b: Branch) {
    setEditing(b);
    setName(b.name);
    setSlug(b.slug);
    setAddress(b.address || "");
    setPhone(b.phone || "");
    setEmail(b.email || "");
    setMapsUrl(b.maps_url || "");
    setMapsEmbed(b.maps_embed || "");
    setDescription(b.description || "");
    setIsPublished(b.is_published);
    setOrderIndex(b.order_index);
    setOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Nhập tên chi nhánh");
      return;
    }
    if (!slug.trim()) {
      toast.error("Nhập slug");
      return;
    }

    const payload = {
      name,
      slug,
      address,
      phone,
      email,
      maps_url: mapsUrl,
      maps_embed: mapsEmbed,
      description,
      is_published: isPublished,
      order_index: orderIndex,
    };

    if (editing) {
      const { error } = await supabase
        .from("branches")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Đã cập nhật chi nhánh");
    } else {
      const { error } = await supabase.from("branches").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Đã tạo chi nhánh");
    }

    setOpen(false);
    fetchBranches();
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", deletingId);
    if (error) {
      toast.error("Lỗi xóa");
      return;
    }
    toast.success("Đã xóa");
    setDeleteOpen(false);
    fetchBranches();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chi nhánh</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý địa điểm chi nhánh và đường dẫn chuẩn SEO.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Thêm chi nhánh
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên chi nhánh</TableHead>
              <TableHead>Đường dẫn (URL)</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Trạng thái</TableHead>
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
            ) : branches.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-400"
                >
                  Chưa có chi nhánh nào
                </TableCell>
              </TableRow>
            ) : (
              branches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      /chi-nhanh/{b.slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 break-words max-w-[200px]">
                    {b.address || "—"}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {b.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.is_published ? "default" : "secondary"}>
                      {b.is_published ? "Hiện" : "Ẩn"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(b)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => openDelete(b.id)}
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
        size="2xl"
        title={editing ? "Sửa chi nhánh" : "Thêm chi nhánh"}
        description="Điền thông tin chi nhánh để hiển thị trên website và tối ưu local SEO."
      >
        <div className="space-y-8">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2">Tên chi nhánh *</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="VD: Văn phòng bán hàng - Quận 1"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="mb-2">Đường dẫn (URL) *</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="van-phong-quan-1"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <FieldDescription>
                    URL: /chi-nhanh/{slug || "slug"}
                  </FieldDescription>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2">Mô tả chi nhánh</FieldLabel>
              <FieldContent>
                <TiptapEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Mô tả dịch vụ, vị trí của chi nhánh..."
                />
              </FieldContent>
            </Field>

            <div className="grid grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2">Số điện thoại</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="0909 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="mb-2">Email</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="contact@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2">Địa chỉ</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Địa chỉ chi nhánh..."
                  value={address}
                  onChange={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setAddress(val.charAt(0).toUpperCase() + val.slice(1));
                  }}
                />
              </FieldContent>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <Field>
                <FieldLabel className="mb-2">Link Google Maps</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="https://maps.google.com/..."
                    value={mapsUrl}
                    onChange={(e) => setMapsUrl(e.target.value)}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="mb-2">
                  Google Maps Embed (URL/iframe)
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Paste iframe hoặc URL src..."
                    value={mapsEmbed}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = val.match(/src="([^"]+)"/);
                      setMapsEmbed(match ? match[1] : val);
                    }}
                    rows={2}
                  />
                </FieldContent>
              </Field>
            </div>

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
