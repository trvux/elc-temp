"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";

import { convertToWebP } from "@/shared/lib/image";
import { createClient } from "@/shared/lib/supabase/client";
import { capitalize, formatPrice, generateSlug } from "@/shared/lib/utils";

import { Category } from "@/modules/category/domain/types";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import type { z } from "zod";
import {
  ProductWithRelations,
  STOCK_STATUS,
  createProductSchema,
} from "../../domain";
import {
  createProductAction,
  deleteProductAction,
  getBrandsAction,
  getProductsAction,
  updateProductAction,
} from "../actions";
import { getProductColumns } from "./ProductColumns";

type ProductFormValues = Omit<
  z.infer<typeof createProductSchema>,
  "description" | "specs"
> & {
  description: any;
  specs: any;
};

type SpecSubItem = {
  label: string;
  value: string;
  unit?: string;
};

type SpecItem = {
  label: string;
  value?: string;
  items?: SpecSubItem[];
};

const AC_TEMPLATE: SpecItem[] = [
  { label: "Công nghệ Inverter", value: "" },
  {
    label: "Công suất làm lạnh",
    items: [
      { label: "", value: "", unit: "HP" },
      { label: "", value: "", unit: "kW" },
      { label: "", value: "", unit: "BTU" },
    ],
  },
  {
    label: "Công suất sưởi",
    items: [
      { label: "", value: "", unit: "HP" },
      { label: "", value: "", unit: "kW" },
      { label: "", value: "", unit: "BTU" },
    ],
  },
  { label: "Điện năng tiêu thụ", value: "" },
  { label: "Phạm vi làm lạnh hiệu quả", value: "" },
];

export function ProductManagement() {
  const queryClient = useQueryClient();
  // Consolidate modal states
  const [activeProduct, setActiveProduct] = useState<ProductWithRelations | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Filters (Keep these as local UI state)
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  const form = useForm<ProductFormValues>({
    resolver: standardSchemaResolver(createProductSchema as any) as any,
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      shortDescription: "",
      description: "",
      originalPrice: 0,
      salePrice: 0,
      discountPercent: 0,
      images: [],
      isFeatured: false,
      isPublished: true,
      orderIndex: 0,
      categoryId: "",
      brandId: "",
      stockStatus: STOCK_STATUS.IN_STOCK,
      specs: AC_TEMPLATE as any,
    },
  });

  const {
    fields: specsFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({
    control: form.control,
    name: "specs",
  });

  // Fetch Data
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await getProductsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "PRODUCT"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction("PRODUCT");
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await getBrandsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (activeProduct && activeProduct !== "new") {
        return updateProductAction({
          ...values,
          id: activeProduct.id,
        } as any);
      }
      return createProductAction(values as any);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(activeProduct === "new" ? "Đã tạo sản phẩm" : "Đã cập nhật sản phẩm");
      setActiveProduct(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProductAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa sản phẩm");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  async function handleDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId);
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        filterCategoryId === "all" || p.categoryId === filterCategoryId;
      const matchFeatured =
        filterIsFeatured === "all" ||
        (filterIsFeatured === "true" ? p.isFeatured : !p.isFeatured);
      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? p.isPublished : !p.isPublished);
      return matchCategory && matchFeatured && matchPublished;
    });
  }, [products, filterCategoryId, filterIsFeatured, filterIsPublished]);

  const flattenedCategories = useMemo(() => {
    const result: (Category & { displayName: string; isParent: boolean })[] =
      [];
    const parents = categories.filter((c) => !c.parentId);

    parents.forEach((parent) => {
      result.push({ ...parent, displayName: parent.name, isParent: true });
      const children = categories.filter((c) => c.parentId === parent.id);
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
      getProductColumns({
        onEdit: (p) => {
          setActiveProduct(p);
          form.reset({
            name: p.name,
            slug: p.slug,
            sku: p.sku,
            shortDescription: p.shortDescription || "",
            description: p.description || "",
            originalPrice: p.originalPrice,
            salePrice: p.salePrice || 0,
            images: p.images || [],
            isFeatured: p.isFeatured,
            isPublished: p.isPublished,
            orderIndex: p.orderIndex,
            categoryId: p.categoryId,
            brandId: p.brandId,
            stockStatus: p.stockStatus || STOCK_STATUS.IN_STOCK,
            discountPercent: p.discountPercent || 0,
            specs: Array.isArray(p.specs) ? p.specs : [],
          });
        },
        onDelete: setDeletingId,
      }),
    [form],
  );

  function openCreate() {
    setActiveProduct("new");
    form.reset({
      name: "",
      slug: "",
      sku: "",
      shortDescription: "",
      description: "",
      originalPrice: 0,
      salePrice: 0,
      images: [],
      isFeatured: false,
      isPublished: true,
      orderIndex: 0,
      categoryId: "",
      brandId: "",
      stockStatus: STOCK_STATUS.IN_STOCK,
      discountPercent: 0,
      specs: AC_TEMPLATE,
    });
  }

  const updateAutoSlug = (
    name: string,
    sku: string,
    catId: string,
    brdId: string,
    specs: any[] = []
  ) => {
    const brandName = brands.find((b) => b.id === brdId)?.name || "";
    
    // Extract HP from specs or name
    let hpValue = "";
    
    // 1. Try to find in specs
    if (Array.isArray(specs)) {
      for (const spec of specs) {
        if (spec.items && Array.isArray(spec.items)) {
          for (const item of spec.items) {
            const valStr = item.value?.toString() || "";
            const unitStr = item.unit?.toString() || "";
            if (unitStr.toUpperCase() === "HP" || valStr.toUpperCase().includes("HP")) {
              const match = valStr.match(/(\d+(\.\d+)?)/);
              if (match) {
                const num = parseFloat(match[1]);
                hpValue = num.toString().replace(".", "").replace(",", "");
                break;
              }
            }
          }
        }
        if (hpValue) break;
      }
    }

    // 2. Fallback to product name if still not found
    if (!hpValue) {
      const nameMatch = name.match(/(\d+(\.\d+)?)\s*HP/i);
      if (nameMatch) {
        const num = parseFloat(nameMatch[1]);
        hpValue = num.toString().replace(".", "").replace(",", "");
      }
    }

    // Clean SKU: only take the first part if it's a set (contains / or +)
    const cleanedSku = sku.split(/[\/\+]/)[0].trim();
    
    // Formula: [hp]hp-[sku] (Brand is now handled by the URL path level)
    let parts = [];
    if (hpValue) parts.push(`${hpValue}hp`);
    if (cleanedSku) parts.push(cleanedSku);
    
    const finalPart = parts.join("-").trim();
    
    if (finalPart) {
      form.setValue("slug", generateSlug(finalPart));
    }
  };

  const supabase = createClient();
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const webpFile = await convertToWebP(file);
      const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });
      if (error) {
        toast.error(`Lỗi upload: ${file.name}`);
        continue;
      }
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      uploaded.push(data.publicUrl);
    }

    const currentImages = form.getValues("images") || [];
    form.setValue("images", [...currentImages, ...uploaded]);
    setUploading(false);
    toast.success(`Đã upload ${uploaded.length} ảnh`);
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

      <div className="flex flex-wrap items-center gap-4 mb-4">
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

        <Select value={filterIsPublished} onValueChange={setFilterIsPublished}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hiển thị</SelectItem>
            <SelectItem value="false">Đang ẩn</SelectItem>
          </SelectContent>
        </Select>

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
        isLoading={isLoadingProducts}
        searchKey="name"
        searchPlaceholder="Tìm kiếm tên sản phẩm..."
      />

      <AdminDialog
        open={!!activeProduct}
        onOpenChange={(open) => !open && setActiveProduct(null)}
        size="full"
        title={activeProduct === "new" ? "Thêm sản phẩm" : "Sửa sản phẩm"}
        description="Cập nhật thông tin chi tiết cho sản phẩm."
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="space-y-8"
        >
          <FieldGroup>
            {/* Thông tin chung */}
            <div className="bg-muted/10 p-6 rounded-2xl border border-border/40">
              <h3 className="text-sm font-bold capitalize tracking-widest text-muted-foreground/60 mb-6">
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Tên sản phẩm *
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <>
                            <Input
                              {...field}
                              placeholder="VD: Máy lạnh Daikin 1.5HP"
                              onChange={(e) => {
                                const val = capitalize(e.target.value);
                                field.onChange(val);
                                updateAutoSlug(
                                  val,
                                  form.getValues("sku"),
                                  form.getValues("categoryId"),
                                  form.getValues("brandId"),
                                  form.getValues("specs"),
                                );
                              }}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </>
                        )}
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
                      <Controller
                        control={form.control}
                        name="sku"
                        render={({ field, fieldState }) => (
                          <>
                            <Input
                              {...field}
                              className="uppercase"
                              placeholder="VD: DAI-FTKY35"
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                field.onChange(val);
                                updateAutoSlug(
                                  form.getValues("name"),
                                  val,
                                  form.getValues("categoryId"),
                                  form.getValues("brandId"),
                                  form.getValues("specs"),
                                );
                              }}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </>
                        )}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-6">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Danh mục
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        control={form.control}
                        name="categoryId"
                        render={({ field, fieldState }) => (
                          <>
                            <Select
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                updateAutoSlug(
                                  form.getValues("name"),
                                  form.getValues("sku"),
                                  val,
                                  form.getValues("brandId"),
                                  form.getValues("specs"),
                                );
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn danh mục" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories
                                  .filter((c) => !c.parentId)
                                  .map((parent) => (
                                    <SelectGroup key={parent.id}>
                                      <SelectLabel className="font-bold py-2 px-2 opacity-50">
                                        {parent.name}
                                      </SelectLabel>
                                      {categories
                                        .filter((c) => c.parentId === parent.id)
                                        .map((child) => (
                                          <SelectItem
                                            key={child.id}
                                            value={child.id}
                                            className="pl-6"
                                          >
                                            {child.name}
                                          </SelectItem>
                                        ))}
                                      <SelectSeparator />
                                    </SelectGroup>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FieldError errors={[fieldState.error]} />
                          </>
                        )}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-6">
                  <Field>
                    <FieldLabel className="mb-2 font-medium text-primary">
                      Thương hiệu
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        control={form.control}
                        name="brandId"
                        render={({ field, fieldState }) => (
                          <>
                            <Select
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                updateAutoSlug(
                                  form.getValues("name"),
                                  form.getValues("sku"),
                                  form.getValues("categoryId"),
                                  val,
                                  form.getValues("specs"),
                                );
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn thương hiệu" />
                              </SelectTrigger>
                              <SelectContent>
                                {brands.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FieldError errors={[fieldState.error]} />
                          </>
                        )}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="md:col-span-12">
                  <Field>
                    <FieldLabel className="mb-2 font-medium">
                      Slug & URL Preview
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        control={form.control}
                        name="slug"
                        render={({ field, fieldState }) => {
                          const catId = form.watch("categoryId");
                          const brdId = form.watch("brandId");
                          const catSlug = categories.find(c => c.id === catId)?.slug || "all";
                          const brdSlug = brands.find(b => b.id === brdId)?.slug || "all";
                          const fullUrl = `/san-pham/${catSlug}/${brdSlug}/${field.value}`;

                          return (
                            <div className="space-y-2">
                              <Input {...field} className="font-mono text-sm" />
                              <div className="p-3 bg-muted/30 rounded-lg border border-dashed border-border/60">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Cấu trúc URL SEO mới:</p>
                                <p className="text-xs font-mono text-primary break-all">{fullUrl}</p>
                              </div>
                              <FieldError errors={[fieldState.error]} />
                            </div>
                          );
                        }}
                      />
                    </FieldContent>
                  </Field>
                </div>
              </div>
            </div>

            {/* Mô tả chi tiết */}
            <Field>
              <FieldLabel className="mb-2 font-medium">
                Mô tả sản phẩm
              </FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Mô tả chi tiết sản phẩm..."
                      uploadImage={async (file) => {
                        const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
                        const { error } = await supabase.storage
                          .from("images")
                          .upload(fileName, file, {
                            contentType: "image/webp",
                          });
                        if (error) throw error;
                        const { data } = supabase.storage
                          .from("images")
                          .getPublicUrl(fileName);
                        return data.publicUrl;
                      }}
                    />
                  )}
                />
              </FieldContent>
            </Field>

            {/* Thiết lập giá */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field>
                <FieldLabel className="mb-2 font-medium text-foreground/80">
                  Giá gốc (VNĐ) *
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="originalPrice"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          type="number"
                          {...field}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") {
                              field.onChange("");
                              return;
                            }
                            const val = Number(raw);
                            field.onChange(val);
                            // Cập nhật giá bán dựa trên % giảm giá hiện tại
                            const discount =
                              form.getValues("discountPercent") || 0;
                            const newSalePrice = Math.round(
                              val * (1 - discount / 100),
                            );
                            form.setValue("salePrice", newSalePrice);
                          }}
                          className="font-bold text-base"
                        />
                        <p className="mt-1.5 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase">
                          Preview giá bán:
                          <span className="text-foreground/80">
                            {formatPrice(field.value)}
                          </span>
                        </p>
                        <FieldError errors={[fieldState.error]} />
                      </>
                    )}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="mb-2 font-medium text-primary">
                  Giá bán (VNĐ)
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="salePrice"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          type="number"
                          {...field}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") {
                              field.onChange("");
                              return;
                            }
                            const val = Number(raw);
                            field.onChange(val);
                            // Tính toán % giảm giá
                            const original =
                              form.getValues("originalPrice") || 0;
                            if (original > 0) {
                              const discount = Math.round(
                                ((original - val) / original) * 100,
                              );
                              form.setValue("discountPercent", discount);
                            }
                          }}
                          className="font-bold text-base text-primary border-primary/20 bg-primary/5"
                        />
                        <p className="mt-1.5 text-[10px] font-bold text-primary/60 tracking-wider uppercase">
                          Preview giá gốc:{" "}
                          <span className="text-primary">
                            {formatPrice(field.value)}
                          </span>
                        </p>
                        <FieldError errors={[fieldState.error]} />
                      </>
                    )}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="mb-2 font-medium text-destructive">
                  Giảm giá (%)
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="discountPercent"
                    render={({ field, fieldState }) => (
                      <>
                        <div className="relative">
                          <Input
                            type="number"
                            {...field}
                            min={0}
                            max={100}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                field.onChange("");
                                return;
                              }
                              const val = Number(raw);
                              field.onChange(val);
                              // Tính toán lại giá bán
                              const original =
                                form.getValues("originalPrice") || 0;
                              const newSalePrice = Math.round(
                                original * (1 - val / 100),
                              );
                              form.setValue("salePrice", newSalePrice);
                            }}
                            className="font-bold text-destructive border-destructive/20 bg-destructive/5 pr-10"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-destructive/40">
                            %
                          </span>
                        </div>
                        <p className="mt-1.5 text-[10px] font-bold text-destructive/60 tracking-wider uppercase">
                          Tiết kiệm:{" "}
                          <span>
                            {formatPrice(
                              (form.getValues("originalPrice") || 0) -
                                (form.getValues("salePrice") || 0),
                            )}
                          </span>
                        </p>
                        <FieldError errors={[fieldState.error]} />
                      </>
                    )}
                  />
                </FieldContent>
              </Field>
            </div>

            {/* Thông số kỹ thuật */}
            <div className="bg-muted/5 p-6 rounded-2xl border border-border/40">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                    Thông số kỹ thuật
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Thiết lập các thông số chi tiết của sản phẩm
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSpec({ label: "", value: "" })}
                  className="h-8 border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Plus size={14} className="mr-1" /> Thêm thông số chính
                </Button>
              </div>

              <div className="space-y-6">
                {specsFields.map((field, i) => {
                  const spec = form.watch(`specs.${i}`);
                  const hasItems = spec?.items && spec.items.length > 0;

                  return (
                    <div
                      key={field.id}
                      className="group relative bg-background/40 p-5 rounded-xl border border-border/40 transition-all hover:border-primary/20 hover:bg-background/60"
                    >
                      <div className="flex gap-4 items-start mb-4">
                        <div className="flex-1">
                          <Field>
                            <FieldLabel className="text-[10px] font-bold uppercase text-muted-foreground/70 mb-1.5 ml-1">
                              Tên thông số
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                placeholder="VD: Công suất làm lạnh"
                                {...form.register(`specs.${i}.label`)}
                                className="bg-background/50"
                              />
                            </FieldContent>
                          </Field>
                        </div>
                        {!hasItems && (
                          <div className="flex-[2]">
                            <Field>
                              <FieldLabel className="text-[10px] font-bold uppercase text-muted-foreground/70 mb-1.5 ml-1">
                                Giá trị
                              </FieldLabel>
                              <FieldContent>
                                <Input
                                  placeholder="VD: 1.5 HP"
                                  {...form.register(`specs.${i}.value`, {
                                    onChange: () => updateAutoSlug(
                                      form.getValues("name"),
                                      form.getValues("sku"),
                                      form.getValues("categoryId"),
                                      form.getValues("brandId"),
                                      form.getValues("specs")
                                    )
                                  })}
                                  className="bg-background/50"
                                />
                              </FieldContent>
                            </Field>
                          </div>
                        )}
                        <div className="pt-6 flex gap-2">
                          {!hasItems && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-[10px] font-bold uppercase text-primary hover:bg-primary/5"
                              onClick={() => {
                                const currentItems = spec.items || [];
                                form.setValue(`specs.${i}.items`, [
                                  ...currentItems,
                                  { label: "", value: "", unit: "" },
                                ]);
                                form.setValue(`specs.${i}.value`, undefined);
                              }}
                            >
                              <Plus size={12} className="mr-1" /> Nhóm con
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => removeSpec(i)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>

                      {hasItems && (
                        <div className="ml-6 pl-6 border-l-2 border-primary/10 space-y-4 pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">
                              Các mục chi tiết
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[9px] font-bold uppercase text-primary hover:bg-primary/5"
                              onClick={() => {
                                const items = spec.items || [];
                                form.setValue(`specs.${i}.items`, [
                                  ...items,
                                  { label: "", value: "", unit: "" },
                                ]);
                              }}
                            >
                              <Plus size={10} className="mr-1" /> Thêm mục
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {spec.items.map((_: any, j: number) => (
                              <div
                                key={j}
                                className="flex gap-3 items-end bg-muted/20 p-3 rounded-lg border border-border/20"
                              >
                                <div className="flex-1">
                                  <Field>
                                    <FieldLabel className="text-[9px] font-bold text-muted-foreground/60 mb-1">
                                      Nhãn (Tùy chọn)
                                    </FieldLabel>
                                    <Input
                                      placeholder="VD: HP"
                                      {...form.register(
                                        `specs.${i}.items.${j}.label`,
                                      )}
                                      className="h-8 text-xs bg-background/50"
                                    />
                                  </Field>
                                </div>
                                <div className="flex-[1.5]">
                                  <Field>
                                    <FieldLabel className="text-[9px] font-bold text-muted-foreground/60 mb-1">
                                      Giá trị *
                                    </FieldLabel>
                                    <Input
                                      placeholder="VD: 2"
                                      {...form.register(
                                        `specs.${i}.items.${j}.value`,
                                        {
                                          onChange: () => updateAutoSlug(
                                            form.getValues("name"),
                                            form.getValues("sku"),
                                            form.getValues("categoryId"),
                                            form.getValues("brandId"),
                                            form.getValues("specs")
                                          )
                                        }
                                      )}
                                      className="h-8 text-xs bg-background/50"
                                    />
                                  </Field>
                                </div>
                                <div className="w-20">
                                  <Field>
                                    <FieldLabel className="text-[9px] font-bold text-muted-foreground/60 mb-1">
                                      Đơn vị
                                    </FieldLabel>
                                    <Input
                                      placeholder="VD: BTU"
                                      {...form.register(
                                        `specs.${i}.items.${j}.unit`,
                                        {
                                          onChange: () => updateAutoSlug(
                                            form.getValues("name"),
                                            form.getValues("sku"),
                                            form.getValues("categoryId"),
                                            form.getValues("brandId"),
                                            form.getValues("specs")
                                          )
                                        }
                                      )}
                                      className="h-8 text-xs bg-background/50"
                                    />
                                  </Field>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    const items = spec.items.filter(
                                      (_: any, idx: number) => idx !== j,
                                    );
                                    if (items.length === 0) {
                                      form.setValue(
                                        `specs.${i}.items`,
                                        undefined,
                                      );
                                      form.setValue(`specs.${i}.value`, "");
                                    } else {
                                      form.setValue(`specs.${i}.items`, items);
                                    }
                                  }}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {specsFields.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/5 border-border/40">
                    <p className="text-sm text-muted-foreground font-medium">
                      Chưa có thông số kỹ thuật nào
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => appendSpec({ label: "", value: "" })}
                      className="mt-2 text-primary font-bold uppercase text-[10px]"
                    >
                      Bắt đầu thêm ngay
                    </Button>
                  </div>
                )}
              </div>
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

                <Controller
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                      {(field.value || []).map((url: string, i: number) => (
                        <div
                          key={i}
                          className="relative group aspect-square ring-1 ring-muted rounded-lg overflow-hidden bg-muted/30"
                        >
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="object-contain p-2"
                            sizes="200px"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
                              onClick={() => {
                                const newImages = [...field.value];
                                newImages.splice(i, 1);
                                field.onChange(newImages);
                              }}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </FieldContent>
            </Field>

            {/* Điều khiển cuối */}
            <div className="flex flex-wrap items-center justify-between gap-6 border-t pt-8">
              <div className="flex items-center gap-8">
                <Field
                  orientation="horizontal"
                  className="w-auto gap-3 flex items-center"
                >
                  <FieldLabel className="w-auto mb-0">Nổi bật</FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Controller
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </FieldContent>
                </Field>
                <Field
                  orientation="horizontal"
                  className="w-auto gap-3 flex items-center"
                >
                  <FieldLabel className="w-auto mb-0">Hiển thị</FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Controller
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </FieldContent>
                </Field>
                <Field
                  orientation="horizontal"
                  className="w-auto gap-3 flex items-center"
                >
                  <FieldLabel className="w-auto mb-0">Tình trạng</FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Controller
                      control={form.control}
                      name="stockStatus"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-[140px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in_stock">Còn hàng</SelectItem>
                            <SelectItem value="out_of_stock">
                              Hết hàng
                            </SelectItem>
                            <SelectItem value="pre_order">Đặt trước</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FieldContent>
                </Field>
                <Field
                  orientation="horizontal"
                  className="w-auto gap-3 flex items-center"
                >
                  <FieldLabel className="w-auto mb-0">Thứ tự</FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Controller
                      control={form.control}
                      name="orderIndex"
                      render={({ field }) => (
                        <Input
                          type="number"
                          className="w-20"
                          {...field}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? "" : Number(val));
                          }}
                        />
                      )}
                    />
                  </FieldContent>
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-8">
              <Button
                variant="outline"
                type="button"
                onClick={() => setActiveProduct(null)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saveMutation.isLoading}>
                {saveMutation.isLoading
                  ? "Đang lưu..."
                  : activeProduct === "new"
                    ? "Tạo sản phẩm mới"
                    : "Cập nhật sản phẩm"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </AdminDialog>

      <DeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}
