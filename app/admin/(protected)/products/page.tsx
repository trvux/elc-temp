"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  description: string;
  images: string[];
  category_id: string;
  original_price: number;
  discount_percent: number;
  sale_price: number | null;
  specs: Record<string, string>;
  is_featured: boolean;
  is_published: boolean;
  order_index: number;
  categories?: { name: string };
};

function calcSalePrice(original: number, discountPercent: number): number {
  return Math.round(original * (1 - discountPercent / 100));
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [salePriceOverride, setSalePriceOverride] = useState<string>("");
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);

  const supabase = createClient();

  // Tính sale price realtime
  const computedSalePrice = salePriceOverride
    ? Number(salePriceOverride)
    : calcSalePrice(originalPrice, discountPercent);

  async function fetchData() {
    const [{ data: prod }, { data: cats }] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(name)")
        .order("order_index"),
      supabase.from("categories").select("*").eq("type", "product"),
    ]);
    setProducts(prod || []);
    setCategories(cats || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setSku("");
    setDescription("");
    setCategoryId("");
    setImages([]);
    setOriginalPrice(0);
    setDiscountPercent(0);
    setSalePriceOverride("");
    setSpecs([]);
    setIsFeatured(false);
    setIsPublished(true);
    setOrderIndex(0);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setSlug(p.slug || "");
    setSku(p.sku || "");
    setDescription(p.description || "");
    setCategoryId(p.category_id || "");
    setImages(p.images || []);
    setOriginalPrice(p.original_price || 0);
    setDiscountPercent(p.discount_percent || 0);
    setSalePriceOverride(p.sale_price ? String(p.sale_price) : "");
    setSpecs(
      Object.entries(p.specs || {}).map(([key, value]) => ({ key, value })),
    );
    setIsFeatured(p.is_featured);
    setIsPublished(p.is_published);
    setOrderIndex(p.order_index);
    setOpen(true);
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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

  function addSpec() {
    setSpecs([...specs, { key: "", value: "" }]);
  }

  function updateSpec(i: number, field: "key" | "value", val: string) {
    const updated = [...specs];
    updated[i][field] = val;
    setSpecs(updated);
  }

  function removeSpec(i: number) {
    setSpecs(specs.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Nhập tên sản phẩm");
      return;
    }

    const specsObj = specs.reduce(
      (acc, { key, value }) => {
        if (key.trim()) acc[key.trim()] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    const payload = {
      name,
      slug,
      sku: sku || null,
      description,
      category_id: categoryId || null,
      images,
      original_price: originalPrice,
      discount_percent: discountPercent,
      sale_price: salePriceOverride
        ? Number(salePriceOverride)
        : computedSalePrice,
      specs: specsObj,
      is_featured: isFeatured,
      is_published: isPublished,
      order_index: orderIndex,
    };

    if (editing) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Lỗi cập nhật");
        return;
      }
      toast.success("Đã cập nhật sản phẩm");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        toast.error("Lỗi tạo mới");
        return;
      }
      toast.success("Đã tạo sản phẩm");
    }

    setOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa sản phẩm này?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Lỗi xóa");
      return;
    }
    toast.success("Đã xóa");
    fetchData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Thêm sản phẩm
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá gốc</TableHead>
              <TableHead>Giá bán</TableHead>
              <TableHead>Nổi bật</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-gray-400"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-gray-400"
                >
                  Chưa có sản phẩm nào
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        width={60}
                        height={60}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-[60px] h-[60px] bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {p.sku || "—"}
                  </TableCell>
                  <TableCell>{p.categories?.name || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {formatVND(p.original_price)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-green-600">
                    {formatVND(p.sale_price || p.original_price)}
                    {p.discount_percent > 0 && (
                      <span className="ml-1 text-xs text-red-500">
                        -{p.discount_percent}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_featured ? "default" : "outline"}>
                      {p.is_featured ? "Nổi bật" : "Thường"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_published ? "default" : "secondary"}>
                      {p.is_published ? "Hiện" : "Ẩn"}
                    </Badge>
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
              {editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên sản phẩm *</Label>
                <Input
                  placeholder="VD: Máy lạnh Daikin 1.5HP"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editing) setSlug(generateSlug(e.target.value));
                  }}
                  className="break-all"
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  placeholder="VD: DAI-FTKY35"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                className="break-all"
              />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                placeholder="may-lanh-daikin-1-5hp"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-xs text-gray-400">URL: /products/{slug || 'slug'}</p>
            </div>

            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <TiptapEditor
                value={description}
                onChange={setDescription}
                placeholder="Mô tả sản phẩm..."
                uploadImage={async (file) => {
                  const ext = file.name.split(".").pop();
                  const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                  const { error } = await supabase.storage.from("images").upload(fileName, file);
                  if (error) throw error;
                  const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                  return data.publicUrl;
                }}
              />
            </div>

            {/* Giá */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label className="text-base font-semibold">Giá bán</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá gốc (VNĐ)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={originalPrice || ""}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="break-all"
              />
                </div>
                <div className="space-y-2">
                  <Label>Giảm giá (%)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={discountPercent || ""}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="break-all"
              />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Override giá bán (để trống = tự tính từ %)</Label>
                <Input
                  type="number"
                  placeholder={`Tự tính: ${formatVND(computedSalePrice)}`}
                  value={salePriceOverride}
                  onChange={(e) => setSalePriceOverride(e.target.value)}
                className="break-all"
              />
              </div>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <span className="text-gray-500">Giá bán cuối: </span>
                <span className="font-bold text-green-600 text-base">
                  {formatVND(computedSalePrice)}
                </span>
                {discountPercent > 0 && (
                  <span className="ml-2 text-red-500">
                    (-{discountPercent}% = tiết kiệm{" "}
                    {formatVND(originalPrice - computedSalePrice)})
                  </span>
                )}
              </div>
            </div>

            {/* Thông số kỹ thuật */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Thông số kỹ thuật
                </Label>
                <Button size="sm" variant="outline" onClick={addSpec}>
                  <Plus size={14} className="mr-1" /> Thêm thông số
                </Button>
              </div>
              {specs.length === 0 && (
                <p className="text-sm text-gray-400">
                  Chưa có thông số. VD: Công suất → 1.5HP
                </p>
              )}
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Tên thông số (VD: Công suất)"
                    value={spec.key}
                    onChange={(e) => updateSpec(i, "key", e.target.value)}
                className="break-all"
              />
                  <Input
                    placeholder="Giá trị (VD: 1.5HP)"
                    value={spec.value}
                    onChange={(e) => updateSpec(i, "value", e.target.value)}
                className="break-all"
              />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500 shrink-0"
                    onClick={() => removeSpec(i)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>

            {/* Upload ảnh */}
            <div className="space-y-2">
              <Label>Ảnh sản phẩm</Label>
              <label className="flex items-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload size={18} className="text-gray-400" />
                <span className="text-sm text-gray-500">
                  {uploading
                    ? "Đang upload..."
                    : "Click để chọn ảnh (có thể chọn nhiều)"}
                </span>
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
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {images.map((url, i) => (
                    <div key={i} className="relative group">
                      <Image
                        src={url}
                        alt=""
                        width={120}
                        height={120}
                        className="rounded object-cover w-full h-[100px]"
                      />
                      <button
                        onClick={() =>
                          setImages(images.filter((_, idx) => idx !== i))
                        }
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                <Label>Nổi bật</Label>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label>Hiển thị</Label>
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
