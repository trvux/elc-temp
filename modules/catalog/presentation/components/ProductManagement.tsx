"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

import { VARIANT_STOCK_STATUS, VARIANT_STOCK_STATUS_MAP, ProductWithRelations, PRODUCT_STATUS, PRODUCT_STATUS_MAP, ProductStatus } from "../../domain";
import type { Role } from "@/modules/auth/domain";
import {
  deleteProductAction,
  getProductsAction,
} from "../actions";
import { getProductColumns } from "./ProductColumns";
import { useProductForm, DEFAULT_VARIANT } from "../hooks/useProductForm";
import { ProductIdentityCard } from "./form/ProductIdentityCard";
import { ProductOrganizationCard } from "./form/ProductOrganizationCard";
import { ProductStatusCard } from "./form/ProductStatusCard";
import { ProductSpecsTab } from "./form/ProductSpecsTab";
import { ProductGalleryTab } from "./form/ProductGalleryTab";
import { ProductDescriptionTab } from "./form/ProductDescriptionTab";
import { ProductVariantsTab } from "./form/ProductVariantsTab";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getProductLinesAction } from "@/modules/product-line/presentation/actions";
import { getAttributeDefinitionsAction } from "@/modules/attribute-definition/presentation/actions";

// Converts the persisted read shape (ProductOption[]/ProductVariant[] —
// values/components carry real IDs) back into the create/update input shape
// the form edits (options by name, variant option-selections by
// {optionName,value}, bundle components by sibling array index) — the
// inverse of what createProductAction/updateProductAction's
// toGoOptionsPayload/toGoVariantsPayload send. Needed because the Go API
// deliberately never round-trips IDs for these back into form-editable
// input fields (see elc-go/docs/product-v2-design.md).
function mapProductToFormVariantTree(p: ProductWithRelations) {
  const options = (p.options || []).map((o) => ({ name: o.name, values: o.values.map((v) => v.value) }));

  const optionValueLookup = new Map<string, { optionName: string; value: string }>();
  (p.options || []).forEach((o) => {
    o.values.forEach((v) => optionValueLookup.set(v.id, { optionName: o.name, value: v.value }));
  });

  const variantIdToIndex = new Map<string, number>();
  (p.variants || []).forEach((v, i) => variantIdToIndex.set(v.id, i));

  const variants = (p.variants || []).map((v) => ({
    mpn: v.mpn,
    sku: v.sku,
    gtin: v.gtin || "",
    isDefault: v.isDefault,
    isComponentOnly: !v.isStandalone,
    stockStatus: v.stockStatus,
    leadTimeDays: v.leadTimeDays ?? null,
    originalPrice: v.originalPrice,
    salePrice: v.salePrice ?? 0,
    discountPercent: v.discountPercent,
    weight: v.weight ?? null,
    isActive: v.isActive,
    orderIndex: v.orderIndex,
    optionSelections: v.optionValueIds
      .map((id) => optionValueLookup.get(id))
      .filter((s): s is { optionName: string; value: string } => !!s),
    components: v.components
      .map((c) => ({
        componentIndex: variantIdToIndex.get(c.componentId) ?? -1,
        quantity: c.quantity,
        role: c.role || "",
      }))
      .filter((c) => c.componentIndex >= 0),
  }));

  return { options, variants };
}

interface ProductManagementProps {
  currentUserRole: Role;
}

export function ProductManagement({ currentUserRole }: ProductManagementProps) {
  const queryClient = useQueryClient();
  const [activeProduct, setActiveProduct] = useState<ProductWithRelations | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Tracks the open dialog's live status/rejectionReason — separate from
  // `form` (status is never part of form values, see CreateProductInput's
  // doc comment) and updated in place when a workflow action in
  // ProductStatusCard succeeds, so the card reflects the new state without
  // needing to refetch/reopen the dialog.
  const [activeStatus, setActiveStatus] = useState<{ status: ProductStatus; rejectionReason: string | null }>({
    status: PRODUCT_STATUS.DRAFT,
    rejectionReason: null,
  });
  // Mirrors elc-go's authdomain.CanPublishContent (super_admin/admin only).
  const canPublish = currentUserRole === "admin" || currentUserRole === "super_admin";

  // Filters
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
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

  const { data: productLines = [] } = useQuery({
    queryKey: ["product-lines"],
    queryFn: async () => {
      const { data, error } = await getProductLinesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: attributeDefinitions = [] } = useQuery({
    queryKey: ["attribute-definitions"],
    queryFn: async () => {
      const { data, error } = await getAttributeDefinitionsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Custom Form Hook
  const {
    form,
    optionsFields,
    appendOption,
    removeOption,
    variantsFields,
    appendVariant,
    removeVariant,
    saveMutation,
    updateAutoSlug,
    regenerateSlug,
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
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchStockStatus = filterStockStatus === "all" || p.displayStockStatus === filterStockStatus;
      return matchGroup && matchCategory && matchFeatured && matchStatus && matchStockStatus;
    });
  }, [products, filterGroupId, filterCategoryId, filterIsFeatured, filterStatus, filterStockStatus, categories]);

  const columns = useMemo(
    () =>
      getProductColumns({
        onEdit: (p) => {
          setActiveProduct(p);
          setActiveStatus({ status: p.status, rejectionReason: p.rejectionReason ?? null });
          const { options, variants } = mapProductToFormVariantTree(p);
          form.reset({
            name: p.name,
            slug: p.slug,
            description: p.description || "",
            images: p.images || [],
            isFeatured: p.isFeatured,
            orderIndex: p.orderIndex,
            categoryId: p.categoryId,
            brandId: p.brandId,
            metaTitle: p.metaTitle || "",
            metaDescription: p.metaDescription || "",
            tagIds: (p.tags || []).map((t) => t.id),
            productLineId: p.productLineId || null,
            options,
            variants,
            attributeValues: (p.attributeValues || []).map((av) => ({
              attributeDefinitionId: av.attributeDefinitionId,
              valueText: av.valueText,
              valueNumber: av.valueNumber,
              valueBoolean: av.valueBoolean,
            })),
          });
        },
        onDelete: setDeletingId,
      }),
    [form]
  );

  function openCreate() {
    setActiveProduct("new");
    setActiveStatus({ status: PRODUCT_STATUS.DRAFT, rejectionReason: null });
    form.reset({
      name: "",
      slug: "",
      description: "",
      images: [],
      isFeatured: false,
      orderIndex: 0,
      categoryId: "",
      brandId: "",
      metaTitle: "",
      metaDescription: "",
      tagIds: [],
      productLineId: null,
      options: [],
      attributeValues: [],
      variants: [DEFAULT_VARIANT],
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
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} className="h-9">
            <Plus size={16} className="mr-2" /> Thêm sản phẩm
          </Button>
        </div>
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

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.values(PRODUCT_STATUS).map((s) => (
              <SelectItem key={s} value={s}>
                {PRODUCT_STATUS_MAP[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Tình trạng kho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tình trạng</SelectItem>
            {Object.values(VARIANT_STOCK_STATUS).map((status) => (
              <SelectItem key={status} value={status}>
                {VARIANT_STOCK_STATUS_MAP[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filterGroupId !== "all" ||
          filterCategoryId !== "all" ||
          filterIsFeatured !== "all" ||
          filterStatus !== "all" ||
          filterStockStatus !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterGroupId("all");
              setFilterCategoryId("all");
              setFilterIsFeatured("all");
              setFilterStatus("all");
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
        <div className="flex flex-col flex-1 min-h-0 relative">
          <div className="w-full">
            <form
              onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
              className="flex-1 flex flex-col min-h-0 w-full"
            >
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start">
                  {/* Primary column — frequently-edited, most important */}
                  <div className="flex flex-col gap-6 min-w-0">
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                          Thông tin sản phẩm
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ProductIdentityCard
                          form={form}
                          categories={categories}
                          brands={brands}
                          productLines={productLines}
                          updateAutoSlug={updateAutoSlug}
                          regenerateSlug={regenerateSlug}
                          isLiveOrWasLive={
                            activeStatus.status === PRODUCT_STATUS.PUBLISHED ||
                            activeStatus.status === PRODUCT_STATUS.ARCHIVED
                          }
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                          Hình ảnh sản phẩm
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ProductGalleryTab form={form} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                          Mô tả chi tiết
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ProductDescriptionTab form={form} />
                      </CardContent>
                    </Card>

                    <Card id="product-variants-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                          Tùy chọn &amp; Biến thể
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ProductVariantsTab
                          form={form}
                          optionsFields={optionsFields}
                          appendOption={appendOption}
                          removeOption={removeOption}
                          variantsFields={variantsFields}
                          appendVariant={appendVariant}
                          removeVariant={removeVariant}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                          Thông số kỹ thuật
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ProductSpecsTab form={form} attributeDefinitions={attributeDefinitions} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Secondary column — glanceable, set-once concerns */}
                  <div className="flex flex-col gap-6 min-w-0 md:sticky md:top-0">
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                          Trạng thái
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ProductStatusCard
                          form={form}
                          productId={activeProduct && activeProduct !== "new" ? activeProduct.id : null}
                          status={activeStatus.status}
                          rejectionReason={activeStatus.rejectionReason}
                          canPublish={canPublish}
                          onStatusChange={setActiveStatus}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                          Phân loại
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ProductOrganizationCard
                          form={form}
                          groups={groups}
                          categories={categories}
                          brands={brands}
                          productLines={productLines}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
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
        </div>
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
