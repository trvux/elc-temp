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

import { STOCK_STATUS, STOCK_STATUS_MAP, ProductWithRelations, PRODUCT_LABELS, SpecItem } from "../../domain";
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
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";

export function ProductManagement() {
  const queryClient = useQueryClient();
  const [activeProduct, setActiveProduct] = useState<ProductWithRelations | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");
  const [filterLabel, setFilterLabel] = useState<string>("all");
  const [filterStockStatus, setFilterStockStatus] = useState<string>("all");

  // Fetch Data
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await getProductsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await getGroupsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-new"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
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
  } = useProductForm(activeProduct, () => setActiveProduct(null));

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

  const handleGroupIdChange = (val: string) => {
    setFilterGroupId(val);
    setFilterCategoryId("all");
  };

  const filteredCategoriesForFilter = useMemo(() => {
    if (filterGroupId === "all") {
      return categories;
    }
    return categories.filter((c) => c.groupId === filterGroupId);
  }, [categories, filterGroupId]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      const matchGroup = filterGroupId === "all" || (cat && cat.groupId === filterGroupId);
      const matchCategory = filterCategoryId === "all" || p.categoryId === filterCategoryId;
      const matchFeatured = filterIsFeatured === "all" || (filterIsFeatured === "true" ? p.isFeatured : !p.isFeatured);
      const matchPublished = filterIsPublished === "all" || (filterIsPublished === "true" ? p.isPublished : !p.isPublished);
      const matchLabel = filterLabel === "all" || (p.labels && p.labels.includes(filterLabel));
      const matchStockStatus = filterStockStatus === "all" || p.stockStatus === filterStockStatus;
      return matchGroup && matchCategory && matchFeatured && matchPublished && matchLabel && matchStockStatus;
    });
  }, [products, filterGroupId, filterCategoryId, filterIsFeatured, filterIsPublished, filterLabel, filterStockStatus, categories]);

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
            metaTitle: p.metaTitle || "",
            metaDescription: p.metaDescription || "",
            specs: Array.isArray(p.specs) ? (p.specs as unknown as SpecItem[]) : [],
            labels: p.labels || [],
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
      metaTitle: "",
      metaDescription: "",
      specs: AC_TEMPLATE,
      labels: [],
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
        <Select value={filterGroupId} onValueChange={handleGroupIdChange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Nhóm danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhóm danh mục</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-80 overflow-y-auto">
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {filteredCategoriesForFilter.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
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

        <Select value={filterLabel} onValueChange={setFilterLabel}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Nhãn hiển thị" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhãn</SelectItem>
            <SelectItem value={PRODUCT_LABELS.NEW}>Mới về (New)</SelectItem>
            <SelectItem value={PRODUCT_LABELS.HOT}>Nổi bật (Hot)</SelectItem>
            <SelectItem value={PRODUCT_LABELS.BEST_SELLER}>Bán chạy (Best Seller)</SelectItem>
            <SelectItem value={PRODUCT_LABELS.SALE}>Giảm giá (Sale)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Tình trạng kho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tình trạng</SelectItem>
            <SelectItem value={STOCK_STATUS.IN_STOCK}>{STOCK_STATUS_MAP[STOCK_STATUS.IN_STOCK]}</SelectItem>
            <SelectItem value={STOCK_STATUS.OUT_OF_STOCK}>{STOCK_STATUS_MAP[STOCK_STATUS.OUT_OF_STOCK]}</SelectItem>
            <SelectItem value={STOCK_STATUS.PRE_ORDER}>{STOCK_STATUS_MAP[STOCK_STATUS.PRE_ORDER]}</SelectItem>
            <SelectItem value={STOCK_STATUS.DISCONTINUED}>{STOCK_STATUS_MAP[STOCK_STATUS.DISCONTINUED]}</SelectItem>
          </SelectContent>
        </Select>

        {(filterGroupId !== "all" ||
          filterCategoryId !== "all" ||
          filterIsFeatured !== "all" ||
          filterIsPublished !== "all" ||
          filterLabel !== "all" ||
          filterStockStatus !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterGroupId("all");
              setFilterCategoryId("all");
              setFilterIsFeatured("all");
              setFilterIsPublished("all");
              setFilterLabel("all");
              setFilterStockStatus("all");
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
                    groups={groups}
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
