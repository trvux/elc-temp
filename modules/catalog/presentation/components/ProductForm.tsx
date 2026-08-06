"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

import { ProductWithRelations, PRODUCT_STATUS, ProductStatus } from "../../domain";
import type { Role } from "@/modules/auth/domain";
import { useProductForm } from "../hooks/useProductForm";
import { ProductIdentityCard } from "./form/ProductIdentityCard";
import { ProductOrganizationCard } from "./form/ProductOrganizationCard";
import { ProductStatusCard } from "./form/ProductStatusCard";
import { ProductSeoCard } from "./form/ProductSeoCard";
import { ProductSpecsTab } from "./form/ProductSpecsTab";
import { ProductGalleryTab } from "./form/ProductGalleryTab";
import { ProductDescriptionTab } from "./form/ProductDescriptionTab";
import { ProductVariantsTab } from "./form/ProductVariantsTab";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getProductLinesAction } from "@/modules/product-line/presentation/actions";
import { getAttributeDefinitionsAction } from "@/modules/attribute-definition/presentation/actions";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: ProductWithRelations;
  currentUserRole: Role;
}

// A dedicated page (not a modal) — Product is the densest-field entity in
// this admin (identity + variants + options + specs + classification +
// SEO), so it gets a real URL like Shopify's /products/new, /products/[id]
// instead of the AdminDialog pattern every other module uses. See
// /Users/tranvux/.claude/plans/majestic-whistling-raccoon.md for why.
export function ProductForm({ mode, product, currentUserRole }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const canPublish = currentUserRole === "admin" || currentUserRole === "super_admin";

  const [activeStatus, setActiveStatus] = useState<{ status: ProductStatus; rejectionReason: string | null }>(
    product
      ? { status: product.status, rejectionReason: product.rejectionReason ?? null }
      : { status: PRODUCT_STATUS.DRAFT, rejectionReason: null }
  );

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

  const { data: attributeDefinitions = [], isLoading: attributeDefinitionsLoading } = useQuery({
    queryKey: ["attribute-definitions"],
    queryFn: async () => {
      const { data, error } = await getAttributeDefinitionsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

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
  } = useProductForm(mode === "edit" && product ? product : "new", () => {
    router.push("/admin/products");
  });

  const goBack = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    router.push("/admin/products");
  };

  return (
    <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button type="button" variant="ghost" size="icon" onClick={goBack} className="shrink-0">
            <ArrowLeft size={18} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight truncate">
              {mode === "create" ? "Thêm sản phẩm" : form.watch("name") || "Sửa sản phẩm"}
            </h1>
            {saveMutation.isPending && <p className="text-xs text-muted-foreground">Đang lưu...</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={goBack}>
            Hủy
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Đang lưu..." : mode === "create" ? "Tạo sản phẩm" : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-10">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start w-full">
          {/* Primary column */}
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
                    activeStatus.status === PRODUCT_STATUS.PUBLISHED || activeStatus.status === PRODUCT_STATUS.ARCHIVED
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Nội dung</CardTitle>
                <Badge variant="outline" className="font-normal">cấp Sản phẩm</Badge>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-6">
                <ProductGalleryTab form={form} />
                <ProductDescriptionTab form={form} />
              </CardContent>
            </Card>

            <Card id="product-variants-card">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Tùy chọn &amp; Biến thể
                </CardTitle>
                <Badge variant="outline" className="font-normal">cấp Biến thể</Badge>
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
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Thông số kỹ thuật
                </CardTitle>
                <Badge variant="outline" className="font-normal">cấp Sản phẩm</Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <ProductSpecsTab
                  form={form}
                  attributeDefinitions={attributeDefinitions}
                  isLoading={attributeDefinitionsLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Secondary column */}
          <div className="flex flex-col gap-6 min-w-0 md:sticky md:top-20">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Trạng thái</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ProductStatusCard
                  form={form}
                  productId={mode === "edit" && product ? product.id : null}
                  status={activeStatus.status}
                  rejectionReason={activeStatus.rejectionReason}
                  canPublish={canPublish}
                  onStatusChange={setActiveStatus}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Phân loại</CardTitle>
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

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">SEO</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ProductSeoCard form={form} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
}
