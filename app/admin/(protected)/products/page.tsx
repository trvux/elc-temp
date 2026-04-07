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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    const { error } = await supabase.from("products").delete().eq("id", deletingId);
    if (error) {
      toast.error("Lỗi xóa");
      return;
    }
    toast.success("Đã xóa");
    setDeleteOpen(false);
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
                      <div className="w-[60px] h-[60px] bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">
                        KHÔNG CÓ ẢNH
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
        size="4xl"
        title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        description="Cập nhật thông tin chi tiết, giá bán và thông số kỹ thuật cho sản phẩm."
      >
        <div className="space-y-8">
          <FieldGroup>
            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2">Tên sản phẩm *</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="VD: Máy lạnh Daikin 1.5HP"
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                      setName(capitalized);
                      if (!editing) setSlug(generateSlug(capitalized));
                    }}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="mb-2">SKU</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="VD: DAI-FTKY35"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </FieldContent>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2">Slug (URL)</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="may-lanh-daikin-1-5hp"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <FieldDescription>URL: /san-pham/{slug || 'slug'}</FieldDescription>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="mb-2">Danh mục</FieldLabel>
                <FieldContent>
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
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2">Mô tả sản phẩm</FieldLabel>
              <FieldContent>
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
              </FieldContent>
            </Field>

            {/* Giá bán */}
            <div className="space-y-6">
              <h3 className="font-semibold text-base">Thiết lập giá bán</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field>
                  <FieldLabel className="mb-2 text-muted-foreground font-normal">Giá gốc (VNĐ)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      placeholder="0"
                      value={originalPrice || ""}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel className="mb-2 text-muted-foreground font-normal">Giảm giá (%)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="100"
                      value={discountPercent || ""}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel className="mb-2 text-muted-foreground font-normal">Ghi đè giá bán</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      placeholder={`Tự tính: ${formatVND(computedSalePrice)}`}
                      value={salePriceOverride}
                      onChange={(e) => setSalePriceOverride(e.target.value)}
                    />
                  </FieldContent>
                </Field>
              </div>

              <div className="bg-muted/30 border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Giá bán cuối cùng</p>
                  <p className="text-2xl font-bold text-green-600 leading-none">
                    {formatVND(computedSalePrice)}
                  </p>
                </div>
                {discountPercent > 0 && (
                  <div className="bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded text-sm text-red-600 dark:text-red-400 font-medium">
                    Tiết kiệm {formatVND(originalPrice - computedSalePrice)} (-{discountPercent}%)
                  </div>
                )}
              </div>
            </div>

            {/* Thông số kỹ thuật */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">Thông số kỹ thuật</h3>
                <Button size="sm" variant="outline" onClick={addSpec} className="h-8">
                  <Plus size={14} className="mr-1.5" /> Thêm thông số
                </Button>
              </div>
              
              {specs.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">Chưa có thông số kỹ thuật nào.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {specs.map((spec, i) => (
                    <div key={i} className="flex gap-2 items-center group">
                      <Input
                        placeholder="Tên (VD: Công suất)"
                        value={spec.key}
                        className="flex-1"
                        onChange={(e) => updateSpec(i, "key", e.target.value)}
                      />
                      <Input
                        placeholder="Giá trị (VD: 1.5HP)"
                        value={spec.value}
                        className="flex-1"
                        onChange={(e) => updateSpec(i, "value", e.target.value)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeSpec(i)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hình ảnh */}
            <Field>
              <FieldLabel className="mb-2">Hình ảnh sản phẩm</FieldLabel>
              <FieldContent>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/20">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Upload size={24} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Nhấn để tải lên sản phẩm</p>
                    <p className="text-xs text-muted-foreground mt-1">Hỗ trợ tối đa 10 ảnh cùng lúc</p>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
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

            {/* Điều khiển cuối */}
            <div className="flex flex-wrap items-center justify-between gap-6 border-t pt-8 pb-4">
              <div className="flex items-center gap-8">
                <Field orientation="horizontal" className="w-auto gap-3 flex items-center">
                  <FieldLabel className="w-auto mb-0">Nổi bật</FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                  </FieldContent>
                </Field>
                <Field orientation="horizontal" className="w-auto gap-3 flex items-center">
                  <FieldLabel className="w-auto mb-0">Hiển thị</FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Switch
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </FieldContent>
                </Field>
                <Field orientation="horizontal" className="w-auto gap-3 flex items-center">
                  <FieldLabel className="w-auto mb-0 flex items-center h-full">Thứ tự</FieldLabel>
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
                <Button variant="outline" onClick={() => setOpen(false)} className="px-6">
                  Hủy
                </Button>
                <Button onClick={handleSave} className="min-w-[140px] px-6">
                  {editing ? "Cập nhật sản phẩm" : "Tạo sản phẩm mới"}
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
