"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, type ProductRow } from "./columns";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { capitalize } from "@/lib/utils";
import Image from "next/image";

type SpecItem = {
  label: string;
  value?: string;
  items?: { label: string; value: string }[];
};

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  slug: string;
};
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
  specs: any; // Flexible for migration, but will be treated as SpecItem[] in code
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

  // Mẫu khung thông số mặc định cho máy lạnh
  const AC_TEMPLATE: SpecItem[] = [
    { label: "Loại máy", value: "" },
    { label: "Công nghệ Inverter", value: "" },
    {
      label: "Công suất làm lạnh",
      items: [
        { label: "HP", value: "" },
        { label: "kW", value: "" },
        { label: "BTU", value: "" },
      ],
    },
    {
      label: "Công suất sưởi",
      items: [
        { label: "HP", value: "" },
        { label: "kW", value: "" },
        { label: "BTU", value: "" },
      ],
    },
    { label: "Điện năng tiêu thụ", value: "" },
    { label: "Phạm vi làm lạnh hiệu quả", value: "" },
  ];

  // Filter states
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

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
  const [specs, setSpecs] = useState<SpecItem[]>([]);
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
        .select("*, categories(name, parent_id)")
        .order("order_index"),
      supabase.from("categories").select("*").eq("type", "product"),
    ]);

    // Enrich products with full category path for table display
    const enrichedProd = prod?.map((p) => {
      if (!p.categories || !p.category_id) return p;
      const cat = cats?.find((c) => c.id === p.category_id);
      if (cat?.parent_id) {
        const parent = cats?.find((c) => c.id === cat.parent_id);
        if (parent) {
          return {
            ...p,
            categories: {
              ...p.categories,
              name: `${parent.name} > ${cat.name}`,
            },
          };
        }
      }
      return p;
    });

    setProducts(enrichedProd || []);
    setCategories(cats || []);
    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        filterCategoryId === "all" || p.category_id === filterCategoryId;
      const matchFeatured =
        filterIsFeatured === "all" ||
        (filterIsFeatured === "true" ? p.is_featured : !p.is_featured);
      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? p.is_published : !p.is_published);
      return matchCategory && matchFeatured && matchPublished;
    });
  }, [products, filterCategoryId, filterIsFeatured, filterIsPublished]);

  useEffect(() => {
    fetchData();
  }, []);

  const flattenedCategories = useMemo(() => {
    const result: (Category & { displayName: string; isParent: boolean })[] =
      [];
    const parents = categories.filter((c) => !c.parent_id);

    parents.forEach((parent) => {
      result.push({
        ...parent,
        displayName: parent.name,
        isParent: true,
      });

      const children = categories.filter((c) => c.parent_id === parent.id);
      children.forEach((child) => {
        result.push({
          ...child,
          displayName: `↳ ${child.name}`,
          isParent: false,
        });
      });
    });

    return result;
  }, [categories]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (p) => openEdit(p as unknown as Product),
        onDelete: openDelete,
      }),
    [products],
  );

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
    setSpecs(AC_TEMPLATE); // Nạp khung mặc định
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
    // Handle both old object format and new array format
    if (Array.isArray(p.specs)) {
      setSpecs(p.specs);
    } else {
      setSpecs(
        Object.entries(p.specs || {}).map(([label, value]) => ({
          label,
          value: String(value),
        })),
      );
    }
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
    setSpecs([...specs, { label: "", value: "" }]);
  }

  function updateSpec(i: number, field: keyof SpecItem, val: any) {
    const updated = [...specs];
    updated[i] = { ...updated[i], [field]: val };
    setSpecs(updated);
  }

  function removeSpec(i: number) {
    setSpecs(specs.filter((_, idx) => idx !== i));
  }

  function addSubSpec(specIndex: number) {
    const updated = [...specs];
    const currentItems = updated[specIndex].items || [];
    updated[specIndex] = {
      ...updated[specIndex],
      items: [...currentItems, { label: "", value: "" }],
      value: undefined, // Clear single value if adding sub-items
    };
    setSpecs(updated);
  }

  function updateSubSpec(
    specIndex: number,
    itemIndex: number,
    field: "label" | "value",
    val: string,
  ) {
    const updated = [...specs];
    const items = [...(updated[specIndex].items || [])];
    items[itemIndex] = { ...items[itemIndex], [field]: val };
    updated[specIndex] = { ...updated[specIndex], items };
    setSpecs(updated);
  }

  function removeSubSpec(specIndex: number, itemIndex: number) {
    const updated = [...specs];
    const items = (updated[specIndex].items || []).filter(
      (_, i) => i !== itemIndex,
    );
    if (items.length === 0) {
      delete updated[specIndex].items;
    } else {
      updated[specIndex] = { ...updated[specIndex], items };
    }
    setSpecs(updated);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Nhập tên sản phẩm");
      return;
    }

    if (!sku.trim()) {
      toast.error("Nhập mã SKU (SKU là bắt buộc và không được trùng)");
      return;
    }

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
      specs: specs.filter((s) => s.label.trim()), // Save as array of objects
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
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deletingId);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý danh sách sản phẩm, giá bán và thông số kỹ thuật.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm sản phẩm
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-1">
        <div className="w-full md:w-auto">
          <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {flattenedCategories.map((c) => (
                <SelectItem
                  key={c.id}
                  value={c.id}
                  className={c.isParent ? "font-bold" : "pl-6"}
                >
                  {c.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-auto">
          <Select value={filterIsFeatured} onValueChange={setFilterIsFeatured}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Mức độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả mức độ</SelectItem>
              <SelectItem value="true">Nổi bật</SelectItem>
              <SelectItem value="false">Thường</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-auto">
          <Select
            value={filterIsPublished}
            onValueChange={setFilterIsPublished}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="true">Đang hiển thị</SelectItem>
              <SelectItem value="false">Đang ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(filterCategoryId !== "all" ||
          filterIsFeatured !== "all" ||
          filterIsPublished !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterCategoryId("all");
              setFilterIsFeatured("all");
              setFilterIsPublished("all");
            }}
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        searchKey="name"
        searchPlaceholder="Tìm kiếm tên, SKU, danh mục..."
      />

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
            <div className="bg-muted/10 p-6 rounded-2xl border border-border/40 transition-colors hover:border-border/60">
              <h3 className="text-fluid-sm font-bold capitalize tracking-widest text-muted-foreground/60 mb-6">
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Tên sản phẩm *
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        placeholder="VD: Máy lạnh Daikin 1.5HP"
                        value={name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const capitalized = capitalize(val);
                          setName(capitalized);
                          setSlug(
                            generateSlug(
                              `${capitalized}${sku ? "-" + sku : ""}`,
                            ),
                          );
                        }}
                      />
                    </FieldContent>
                  </Field>
                </div>
                <div className="md:col-span-4">
                  <Field>
                    <FieldLabel className="mb-2 font-medium text-primary">
                      SKU / Mã SP *
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        className="border-primary/20 focus:border-primary"
                        placeholder="VD: DAI-FTKY35"
                        value={sku}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setSku(val);
                          // Slug sẽ bao gồm cả SKU để đảm bảo duy nhất dù trùng tên
                          setSlug(
                            generateSlug(`${name}${val ? "-" + val : ""}`),
                          );
                        }}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-5">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Danh mục
                    </FieldLabel>
                    <FieldContent>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((c) => !c.parent_id)
                            .map((parent) => {
                              const children = categories.filter(
                                (c) => c.parent_id === parent.id,
                              );
                              return (
                                <SelectGroup key={parent.id}>
                                  <SelectLabel className="font-bold text-foreground py-2 px-2 capitalize text-fluid-tiny tracking-wider opacity-50">
                                    {parent.name}
                                  </SelectLabel>
                                  {children.length > 0 ? (
                                    children.map((child) => (
                                      <SelectItem
                                        key={child.id}
                                        value={child.id}
                                        className="pl-6"
                                      >
                                        {child.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="text-[10px] italic text-muted-foreground px-6 py-1">
                                      Chưa có danh mục con
                                    </div>
                                  )}
                                  <SelectSeparator />
                                </SelectGroup>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-7">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Slug (Đường dẫn tinh gọn)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        className="font-mono text-sm"
                        placeholder="may-lanh-daikin-1-5hp"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-12">
                  <div className="bg-white/50 border rounded-lg p-3 flex items-center gap-2">
                    <div className="text-[10px] bg-muted/50 px-2 py-0.5 rounded font-bold capitalize text-muted-foreground/70 shrink-0 select-none">
                      Xem trước URL
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      /san-pham/
                      <span className="text-primary font-medium">
                        {(() => {
                          const cat = categories.find(
                            (c) => c.id === categoryId,
                          );
                          return cat?.slug ? `${cat.slug}/` : "";
                        })()}
                      </span>
                      <span className="text-primary font-bold">
                        {slug || "slug-san-pham"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium">
                Mô tả sản phẩm
              </FieldLabel>
              <FieldContent>
                <TiptapEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Mô tả sản phẩm..."
                  uploadImage={async (file) => {
                    const ext = file.name.split(".").pop();
                    const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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

            {/* Giá bán */}
            <div className="space-y-6">
              <h3 className="font-semibold text-fluid-h3 tracking-tight">
                Thiết lập giá bán
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field>
                  <FieldLabel className="mb-2 text-muted-foreground font-normal">
                    Giá gốc (VNĐ)
                  </FieldLabel>
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
                  <FieldLabel className="mb-2 text-muted-foreground font-normal">
                    Giảm giá (%)
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="100"
                      value={discountPercent || ""}
                      onChange={(e) =>
                        setDiscountPercent(Number(e.target.value))
                      }
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel className="mb-2 text-muted-foreground font-normal">
                    Ghi đè giá bán
                  </FieldLabel>
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
                  <p className="text-xs text-muted-foreground capitalize font-semibold">
                    Giá bán cuối cùng
                  </p>
                  <p className=" font-bold text-primary leading-none">
                    {formatVND(computedSalePrice)}
                  </p>
                </div>
                {discountPercent > 0 && (
                  <div className="bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded text-sm text-red-600 dark:text-red-400 font-medium">
                    Tiết kiệm {formatVND(originalPrice - computedSalePrice)} (-
                    {discountPercent}%)
                  </div>
                )}
              </div>
            </div>

            {/* Thông số kỹ thuật */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-fluid-h3 tracking-tight">
                  Thông số kỹ thuật
                </h3>
                <Button size="sm" variant="outline" onClick={addSpec}>
                  <Plus size={14} className="mr-1.5" /> Thêm thông số
                </Button>
              </div>

              {specs.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Chưa có thông số kỹ thuật nào.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {specs.map((spec, i) => (
                    <div
                      key={i}
                      className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm space-y-4 transition-all"
                    >
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                        <div className="flex-1 w-full space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Tên thông số</label>
                          <Input
                            placeholder="VD: Công suất sưởi"
                            value={spec.label}
                            className="font-medium"
                            onChange={(e) => updateSpec(i, "label", e.target.value)}
                          />
                        </div>
                        
                        {!spec.items && (
                          <div className="flex-[1.5] w-full space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Giá trị</label>
                            <Input
                              placeholder="Nhập giá trị hoặc chọn nhóm đơn vị"
                              value={spec.value || ""}
                              onChange={(e) =>
                                updateSpec(i, "value", e.target.value)
                              }
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          {!spec.items && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addSubSpec(i)}
                              className="text-[10px] h-9 px-3 font-semibold uppercase tracking-tight"
                              disabled={!!spec.value && spec.value.trim() !== ""}
                            >
                              <Plus size={14} className="mr-1.5" /> Nhóm đơn vị
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeSpec(i)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>

                      {spec.items && (
                        <div className="pl-6 space-y-4 border-l-2 border-muted ml-2 py-2">
                          <div className="flex items-center justify-between">
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Đơn vị đo lường (HP, kW, BTU/h...)</p>
                             <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => addSubSpec(i)}
                              className="text-[10px] h-7 text-primary hover:text-primary/80 font-bold uppercase"
                            >
                              + Thêm đơn vị
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {spec.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex gap-3 items-center group">
                                <div className="w-32">
                                  <Input
                                    placeholder="Đơn vị"
                                    value={item.label}
                                    className="h-9 text-xs"
                                    onChange={(e) =>
                                      updateSubSpec(
                                        i,
                                        itemIdx,
                                        "label",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex-1">
                                  <Input
                                    placeholder="Giá trị"
                                    value={item.value}
                                    className="h-9 text-xs"
                                    onChange={(e) =>
                                      updateSubSpec(
                                        i,
                                        itemIdx,
                                        "value",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeSubSpec(i, itemIdx)}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hình ảnh */}
            <Field>
              <FieldLabel className="mb-2 font-medium">
                Hình ảnh sản phẩm
              </FieldLabel>
              <FieldContent>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/20">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Upload size={24} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Nhấn để tải lên sản phẩm
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hỗ trợ tối đa 10 ảnh cùng lúc
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                    {images.map((url, i) => (
                      <div
                        key={i}
                        className="relative group aspect-square ring-1 ring-muted rounded-lg overflow-hidden bg-muted/30"
                      >
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
                            onClick={() =>
                              setImages(images.filter((_, idx) => idx !== i))
                            }
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
                <Field
                  orientation="horizontal"
                  className="w-auto gap-3 flex items-center"
                >
                  <FieldLabel className="w-auto mb-0">Nổi bật</FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Switch
                      checked={isFeatured}
                      onCheckedChange={setIsFeatured}
                    />
                  </FieldContent>
                </Field>
                <Field
                  orientation="horizontal"
                  className="w-auto gap-3 flex items-center"
                >
                  <FieldLabel className="w-auto mb-0">Hiển thị</FieldLabel>
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
                  <FieldLabel className="w-auto mb-0 flex items-center h-full">
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
