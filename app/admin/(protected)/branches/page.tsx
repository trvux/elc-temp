"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    setName(val);
    if (!editing) setSlug(generateSlug(val));
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

  async function handleDelete(id: string) {
    if (!confirm("Xóa chi nhánh này?")) return;
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) {
      toast.error("Lỗi xóa");
      return;
    }
    toast.success("Đã xóa");
    fetchBranches();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chi nhánh</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mỗi chi nhánh có URL riêng để tăng độ phủ SEO
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
              <TableHead>Slug (URL)</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Phone</TableHead>
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
                  <TableCell className="text-sm whitespace-nowrap">{b.phone || "—"}</TableCell>
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
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => handleDelete(b.id)}
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
              {editing ? "Sửa chi nhánh" : "Thêm chi nhánh"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên chi nhánh *</Label>
                <Input
                  placeholder="VD: Văn phòng Quận 1"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                className="break-all"
              />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL) *</Label>
                <Input
                  placeholder="van-phong-quan-1"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                className="break-all"
              />
                <p className="text-xs text-gray-400">
                  URL: /chi-nhanh/{slug || "slug"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả chi nhánh</Label>
              <TiptapEditor
                value={description}
                onChange={setDescription}
                placeholder="VD: Văn phòng tiếp khách, tư vấn và báo giá..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  placeholder="0909 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                className="break-all"
              />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  placeholder="contact@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                className="break-all"
              />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input
                placeholder="123 Nguyễn Văn A, P.Bến Nghé, Q.1, TP.HCM"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="break-all"
              />
            </div>

            <div className="space-y-2">
              <Label>Link Google Maps</Label>
              <Input
                placeholder="https://maps.google.com/..."
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Google Maps Embed (iframe src)</Label>
              <Textarea
                placeholder='Paste cả thẻ <iframe ...> hoặc chỉ URL trong src="..."'
                value={mapsEmbed}
                onChange={(e) => {
                  const val = e.target.value;
                  const match = val.match(/src="([^"]+)"/);
                  setMapsEmbed(match ? match[1] : val);
                }}
                rows={3}
                className="break-all"
              />
              <p className="text-xs text-gray-400">
                Paste cả thẻ iframe cũng được — tự động lấy URL trong src
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thứ tự hiển thị</Label>
                <Input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                className="break-all"
              />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label>Hiển thị công khai</Label>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave}>
              {editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
