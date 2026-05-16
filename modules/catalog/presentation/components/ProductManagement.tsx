"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

import { Category } from "@/modules/category/domain/types";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { STOCK_STATUS, ProductWithRelations } from "../../domain";
import {
  deleteProductAction,
  getBrandsAction,
  getProductsAction,
} from "../actions";
import { getProductColumns } from "./ProductColumns";
import { useProductForm, AC_TEMPLATE } from "../hooks/useProductForm";
import { ProductGeneralTab } from "./form/ProductGeneralTab";
import { ProductSpecsTab } from "./form/ProductSpecsTab";
import { ProductGalleryTab } from "./form/ProductGalleryTab";
import { ProductDescriptionTab } from "./form/ProductDescriptionTab";

export function ProductManagement() {
  const queryClient = useQueryClient();
  const [activeProduct, setActiveProduct] = useState<ProductWithRelations | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

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

  // Custom Form Hook
  const {
    form,
    specsFields,
    appendSpec,
    removeSpec,
    appendSpecItem,
    removeSpecItem,
    saveMutation,
    updateAutoSlug,
    handleUpload,
    uploading,
  } = useProductForm(activeProduct, () => setActiveProduct(null), brands);

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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = filterCategoryId === "all" || p.categoryId === filterCategoryId;
      const matchFeatured = filterIsFeatured === "all" || (filterIsFeatured === "true" ? p.isFeatured : !p.isFeatured);
      const matchPublished = filterIsPublished === "all" || (filterIsPublished === "true" ? p.isPublished : !p.isPublished);
      return matchCategory && matchFeatured && matchPublished;
    });
  }, [products, filterCategoryId, filterIsFeatured, filterIsPublished]);

  const flattenedCategories = useMemo(() => {
    const result: (Category & { displayName: string; isParent: boolean })[] = [];
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
    [form]
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
        <Tabs defaultValue="general" className="flex flex-col flex-1 min-h-0 relative">
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
                <TabsContent value="general" className="mt-0 focus-visible:outline-none pb-8">
                  <ProductGeneralTab
                    form={form}
                    categories={categories}
                    brands={brands}
                    updateAutoSlug={updateAutoSlug}
                  />
                </TabsContent>

                <TabsContent value="specs" className="mt-0 focus-visible:outline-none pb-8">
                  <ProductSpecsTab
                    form={form}
                    specsFields={specsFields}
                    appendSpec={appendSpec}
                    removeSpec={removeSpec}
                    appendSpecItem={appendSpecItem}
                    removeSpecItem={removeSpecItem}
                    updateAutoSlug={updateAutoSlug}
                  />
                </TabsContent>

                <TabsContent value="description" className="mt-0 focus-visible:outline-none">
                  <ProductDescriptionTab form={form} />
                  <div className="mt-12">
                    <ProductGalleryTab
                      form={form}
                      uploading={uploading}
                      handleUpload={handleUpload}
                    />
                  </div>
                </TabsContent>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
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
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
