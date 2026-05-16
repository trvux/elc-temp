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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";

import { convertToWebP } from "@/shared/lib/image";
import { createClient } from "@/shared/lib/supabase/client";
import { formatPrice, generateSlug } from "@/shared/lib/utils";

import { Category } from "@/modules/category/domain/types";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import type { z } from "zod";
import {
  createProductSchema,
  ProductWithRelations,
  STOCK_STATUS,
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
  const [activeProduct, setActiveProduct] = useState<
    ProductWithRelations | "new" | null
  >(null);
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
      mpn: "",
      gtin: "",
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

  const appendSpecItem = (index: number, item: any) => {
    const currentSpecs = form.getValues("specs");
    const currentItems = currentSpecs[index].items || [];
    form.setValue(`specs.${index}.items`, [...currentItems, item]);
  };

  const removeSpecItem = (specIndex: number, itemIndex: number) => {
    const currentSpecs = form.getValues("specs");
    const currentItems = currentSpecs[specIndex].items || [];
    const nextItems = [...currentItems];
    nextItems.splice(itemIndex, 1);
    form.setValue(`specs.${specIndex}.items`, nextItems);
  };

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
      toast.success(
        activeProduct === "new" ? "Đã tạo sản phẩm" : "Đã cập nhật sản phẩm",
      );
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
            mpn: p.mpn || "",
            gtin: p.gtin || "",
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
      mpn: "",
      gtin: "",
      specs: AC_TEMPLATE,
    });
  }

  const updateAutoSlug = (
    name: string,
    sku: string,
    catId: string,
    brdId: string,
    specs: any[] = [],
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
            if (
              unitStr.toUpperCase() === "HP" ||
              valStr.toUpperCase().includes("HP")
            ) {
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
        <Tabs
          defaultValue="general"
          className="flex flex-col flex-1 min-h-0 relative"
        >
          <div className="flex sticky top-0 z-20 w-full items-center justify-center border-b bg-background/95 py-4 backdrop-blur">
            <TabsList>
              <TabsTrigger value="general">Thông tin chung</TabsTrigger>
              <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
              <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>
            </TabsList>
          </div>

          <div className="w-full max-w-5xl mx-auto">
            <form
              onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
              className="flex-1 flex flex-col min-h-0 w-full"
            >
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                <TabsContent
                  value="general"
                  className="mt-0 focus-visible:outline-none pb-8"
                >
                  <FieldGroup className="gap-8">
                    <FieldSet>
                      <FieldLegend>Thông tin sản phẩm</FieldLegend>
                      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <Controller
                          control={form.control}
                          name="name"
                          render={({ field, fieldState }) => (
                            <Field className="md:col-span-2">
                              <FieldLabel>Tên sản phẩm *</FieldLabel>
                              <Input
                                {...field}
                                placeholder="VD: Máy lạnh Daikin 1.5HP"
                                onChange={(e) => {
                                  field.onChange(e);
                                  updateAutoSlug(
                                    e.target.value,
                                    form.getValues("sku"),
                                    form.getValues("categoryId"),
                                    form.getValues("brandId"),
                                  );
                                }}
                              />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="sku"
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Mã sản phẩm (SKU) *</FieldLabel>
                              <Input
                                {...field}
                                placeholder="VD: DAIKIN-15HP"
                                onChange={(e) => {
                                  field.onChange(e);
                                  updateAutoSlug(
                                    form.getValues("name"),
                                    e.target.value,
                                    form.getValues("categoryId"),
                                    form.getValues("brandId"),
                                  );
                                }}
                              />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="stockStatus"
                          render={({ field }) => (
                            <Field>
                              <FieldLabel>Trạng thái kho</FieldLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="in_stock">
                                    Còn hàng
                                  </SelectItem>
                                  <SelectItem value="out_of_stock">
                                    Hết hàng
                                  </SelectItem>
                                  <SelectItem value="pre_order">
                                    Đặt trước
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="categoryId"
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Danh mục</FieldLabel>
                              <Select
                                value={field.value}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  updateAutoSlug(
                                    form.getValues("name"),
                                    form.getValues("sku"),
                                    val,
                                    form.getValues("brandId"),
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
                                        <SelectLabel className="opacity-50">
                                          {parent.name}
                                        </SelectLabel>
                                        {categories
                                          .filter(
                                            (c) => c.parentId === parent.id,
                                          )
                                          .map((child) => (
                                            <SelectItem
                                              key={child.id}
                                              value={child.id}
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
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="brandId"
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Thương hiệu</FieldLabel>
                              <Select
                                value={field.value}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  updateAutoSlug(
                                    form.getValues("name"),
                                    form.getValues("sku"),
                                    form.getValues("categoryId"),
                                    val,
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
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="mpn"
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>MPN (Mã linh kiện)</FieldLabel>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="VD: MPN-123"
                              />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="gtin"
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>GTIN (Barcode/EAN)</FieldLabel>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="VD: 8931234567890"
                              />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="slug"
                          render={({ field, fieldState }) => {
                            const catId = form.watch("categoryId");
                            const brdId = form.watch("brandId");
                            const catSlug =
                              categories.find((c) => c.id === catId)?.slug ||
                              "all";
                            const brdSlug =
                              brands.find((b) => b.id === brdId)?.slug || "all";
                            const fullUrl = `/san-pham/${catSlug}/${brdSlug}/${field.value}`;

                            return (
                              <Field className="md:col-span-2">
                                <FieldLabel>Slug & URL Preview</FieldLabel>
                                <Input {...field} />
                                <FieldDescription>
                                  URL: {fullUrl}
                                </FieldDescription>
                                <FieldError errors={[fieldState.error]} />
                              </Field>
                            );
                          }}
                        />
                      </FieldGroup>
                    </FieldSet>

                    <FieldSeparator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FieldSet>
                        <FieldLegend>Giá bán</FieldLegend>
                        <FieldGroup className="gap-5">
                          <Controller
                            control={form.control}
                            name="originalPrice"
                            render={({ field, fieldState }) => (
                              <Field>
                                <FieldLabel>Giá gốc *</FieldLabel>
                                <Input
                                  type="number"
                                  {...field}
                                  placeholder="0"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    field.onChange(val);
                                    const discount =
                                      form.getValues("discountPercent") || 0;
                                    form.setValue(
                                      "salePrice",
                                      Math.round(val * (1 - discount / 100)),
                                    );
                                  }}
                                />
                                <FieldDescription>
                                  {formatPrice(field.value)}
                                </FieldDescription>
                                <FieldError errors={[fieldState.error]} />
                              </Field>
                            )}
                          />

                          <Controller
                            control={form.control}
                            name="salePrice"
                            render={({ field, fieldState }) => (
                              <Field>
                                <FieldLabel>Giá bán</FieldLabel>
                                <Input
                                  type="number"
                                  {...field}
                                  placeholder="0"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    field.onChange(val);
                                    const original =
                                      form.getValues("originalPrice") || 0;
                                    if (original > 0) {
                                      form.setValue(
                                        "discountPercent",
                                        Math.round(
                                          ((original - val) / original) * 100,
                                        ),
                                      );
                                    }
                                  }}
                                />
                                <FieldError errors={[fieldState.error]} />
                              </Field>
                            )}
                          />

                          <Controller
                            control={form.control}
                            name="discountPercent"
                            render={({ field, fieldState }) => (
                              <Field>
                                <FieldLabel>Giảm %</FieldLabel>
                                <Input
                                  type="number"
                                  {...field}
                                  placeholder="0"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    field.onChange(val);
                                    const original =
                                      form.getValues("originalPrice") || 0;
                                    form.setValue(
                                      "salePrice",
                                      Math.round(original * (1 - val / 100)),
                                    );
                                  }}
                                />
                                <FieldError errors={[fieldState.error]} />
                              </Field>
                            )}
                          />
                        </FieldGroup>
                      </FieldSet>

                      <FieldSet>
                        <FieldLegend>Cấu hình hiển thị</FieldLegend>
                        <FieldGroup className="gap-5">
                          <Controller
                            control={form.control}
                            name="orderIndex"
                            render={({ field }) => (
                              <Field>
                                <FieldLabel>Thứ tự hiển thị</FieldLabel>
                                <Input
                                  type="number"
                                  {...field}
                                  onFocus={(e) => e.target.select()}
                                />
                              </Field>
                            )}
                          />

                          <div className="grid grid-cols-1 gap-4">
                            <Controller
                              control={form.control}
                              name="isFeatured"
                              render={({ field }) => (
                                <Field
                                  orientation="horizontal"
                                  className="justify-between border p-3 rounded-lg"
                                >
                                  <FieldLabel className="font-normal">
                                    Sản phẩm nổi bật
                                  </FieldLabel>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </Field>
                              )}
                            />

                            <Controller
                              control={form.control}
                              name="isPublished"
                              render={({ field }) => (
                                <Field
                                  orientation="horizontal"
                                  className="justify-between border p-3 rounded-lg"
                                >
                                  <FieldLabel className="font-normal">
                                    Trạng thái hiển thị
                                  </FieldLabel>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </Field>
                              )}
                            />
                          </div>
                        </FieldGroup>
                      </FieldSet>
                    </div>

                    <FieldSet>
                      <div className="flex items-center justify-between mb-4">
                        <FieldLegend>Hình ảnh sản phẩm</FieldLegend>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          asChild
                        >
                          <label className="cursor-pointer">
                            <Input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={handleUpload}
                              disabled={uploading}
                            />
                            <Upload size={14} className="mr-2" />
                            {uploading ? "Đang tải..." : "Thêm ảnh"}
                          </label>
                        </Button>
                      </div>

                      <Controller
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {(field.value || []).map(
                              (url: string, i: number) => (
                                <div
                                  key={i}
                                  className="group relative aspect-square bg-background rounded-lg border overflow-hidden"
                                >
                                  <Image
                                    src={url}
                                    alt=""
                                    fill
                                    className="object-contain p-2"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="h-7 w-7 rounded-full"
                                      onClick={() => {
                                        const next = [...field.value];
                                        next.splice(i, 1);
                                        field.onChange(next);
                                      }}
                                    >
                                      <X size={14} />
                                    </Button>
                                  </div>
                                </div>
                              ),
                            )}
                            {(!field.value || field.value.length === 0) && (
                              <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl bg-muted/5">
                                <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                                  Chưa có hình ảnh nào
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      />
                    </FieldSet>
                  </FieldGroup>
                </TabsContent>

                <TabsContent
                  value="specs"
                  className="mt-0 focus-visible:outline-none pb-8"
                >
                  <FieldSet>
                    <div className="flex items-center justify-between">
                      <FieldLegend>Thông số kỹ thuật</FieldLegend>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendSpec({ label: "", value: "" })}
                      >
                        <Plus size={14} className="mr-2" /> Thêm thông số mới
                      </Button>
                    </div>

                    <FieldGroup>
                      {specsFields.map((field, i) => {
                        const spec = form.watch(`specs.${i}`);
                        const hasItems = spec?.items && spec.items.length > 0;

                        return (
                          <div key={field.id} className="border p-4 rounded-lg">
                            <FieldGroup>
                              <Field>
                                <FieldLabel>Tên thông số (Nhãn)</FieldLabel>
                                <Input
                                  placeholder="VD: Kích thước"
                                  {...form.register(`specs.${i}.label`)}
                                />
                              </Field>

                              {!hasItems && (
                                <Field>
                                  <FieldLabel>Giá trị hiển thị</FieldLabel>
                                  <Input
                                    placeholder="VD: 800 x 600 mm"
                                    {...form.register(`specs.${i}.value`, {
                                      onChange: () =>
                                        updateAutoSlug(
                                          form.getValues("name"),
                                          form.getValues("sku"),
                                          form.getValues("categoryId"),
                                          form.getValues("brandId"),
                                        ),
                                    })}
                                  />
                                </Field>
                              )}

                              {hasItems && (
                                <FieldSet>
                                  <div className="flex items-center justify-between">
                                    <FieldLegend variant="label">
                                      Danh sách mục con
                                    </FieldLegend>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        appendSpecItem(i, {
                                          label: "",
                                          value: "",
                                        })
                                      }
                                    >
                                      <Plus size={14} className="mr-1" /> Thêm
                                      mục
                                    </Button>
                                  </div>

                                  <FieldGroup>
                                    {spec.items?.map((_: any, j: number) => (
                                      <Field
                                        key={j}
                                        orientation="horizontal"
                                        className="gap-2"
                                      >
                                        <Input
                                          placeholder="Nhãn"
                                          {...form.register(
                                            `specs.${i}.items.${j}.label`,
                                          )}
                                        />
                                        <Input
                                          placeholder="Giá trị"
                                          {...form.register(
                                            `specs.${i}.items.${j}.value`,
                                          )}
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeSpecItem(i, j)}
                                        >
                                          <X size={14} />
                                        </Button>
                                      </Field>
                                    ))}
                                  </FieldGroup>
                                </FieldSet>
                              )}

                              <div className="flex justify-end gap-2 pt-2 border-t">
                                {!hasItems && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      appendSpecItem(i, {
                                        label: "",
                                        value: "",
                                      });
                                      form.setValue(
                                        `specs.${i}.value`,
                                        undefined,
                                      );
                                    }}
                                  >
                                    + Nhóm con
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => removeSpec(i)}
                                >
                                  <Trash2 size={14} className="mr-1" /> Xóa
                                  thông số
                                </Button>
                              </div>
                            </FieldGroup>
                          </div>
                        );
                      })}
                    </FieldGroup>
                  </FieldSet>
                </TabsContent>

                <TabsContent
                  value="description"
                  className="mt-0 focus-visible:outline-none"
                >
                  <FieldSet>
                    <FieldLegend>Mô tả chi tiết sản phẩm</FieldLegend>
                    <FieldGroup>
                      <Field>
                        <Controller
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <TiptapEditor
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Bắt đầu kể câu chuyện về sản phẩm của bạn..."
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
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </TabsContent>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveProduct(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? "Đang lưu..."
                    : activeProduct === "new"
                      ? "Tạo sản phẩm"
                      : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </div>
        </Tabs>
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
