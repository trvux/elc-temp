import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";
import { generateSlug } from "@/shared/lib/helpers";

import { createProductSchema, ProductWithRelations, VARIANT_STOCK_STATUS, CreateProductInput, UpdateProductInput } from "../../domain";
import { createProductAction, updateProductAction } from "../actions";

export type ProductFormValues = Omit<
  z.infer<typeof createProductSchema>,
  "description"
> & {
  description: unknown;
};

// The single default variant every new product form starts with — see the
// Product doc comment in domain/types.ts.
export const DEFAULT_VARIANT: ProductFormValues["variants"][number] = {
  mpn: "",
  sku: "",
  gtin: "",
  isDefault: true,
  isComponentOnly: false,
  stockStatus: VARIANT_STOCK_STATUS.IN_STOCK,
  leadTimeDays: null,
  originalPrice: 0,
  salePrice: null,
  discountPercent: 0,
  weight: null,
  isActive: true,
  orderIndex: 0,
  optionSelections: [],
  components: [],
};

const EMPTY_DEFAULTS: ProductFormValues = {
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
  highlights: [],
  options: [],
  attributeValues: [],
  // Every product needs >=1 variant (the Go backend rejects zero — see
  // elc-go's domain.Product doc comment).
  variants: [DEFAULT_VARIANT],
};

// Converts the persisted read shape (ProductOption[]/ProductVariant[] —
// values/components carry real IDs) back into the create/update input shape
// the form edits (options by name, variant option-selections by
// {optionName,value}, bundle components by sibling array index) — the
// inverse of what createProductAction/updateProductAction's
// toGoOptionsPayload/toGoVariantsPayload send. Needed because the Go API
// deliberately never round-trips IDs for these back into form-editable
// input fields (see elc-go/docs/product-v2-design.md).
function mapProductToFormValues(p: ProductWithRelations): ProductFormValues {
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

  return {
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
    highlights: p.highlights || [],
    options,
    variants,
    attributeValues: (p.attributeValues || []).map((av) => ({
      attributeDefinitionId: av.attributeDefinitionId,
      valueText: av.valueText,
      valueNumber: av.valueNumber,
      valueBoolean: av.valueBoolean,
      valueOptions: av.valueOptions,
    })),
  };
}

export function useProductForm(
  activeProduct: ProductWithRelations | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // activeProduct never changes identity across this hook's lifetime —
  // ProductForm (the only caller) is a fresh mount per navigation to
  // /admin/products/new or /admin/products/[id], so computing defaultValues
  // once here (rather than an imperative form.reset() after mount) is both
  // correct and avoids a flash of empty fields on the edit route.
  const form = useForm<ProductFormValues>({
    resolver: standardSchemaResolver(createProductSchema) as unknown as Resolver<ProductFormValues>,
    defaultValues:
      activeProduct && activeProduct !== "new" ? mapProductToFormValues(activeProduct) : EMPTY_DEFAULTS,
  });

  // options/variants — nested manipulation (option values, variant
  // option-selections/components) is handled inline in ProductVariantsTab
  // via form.getValues/setValue; ProductSpecsTab.tsx manages attributeValues
  // similarly (no separate useFieldArray needed there — see its own
  // "sync during render" comment).
  const {
    fields: optionsFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const {
    fields: variantsFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (activeProduct && activeProduct !== "new") {
        return updateProductAction({
          ...values,
          id: activeProduct.id,
        } as unknown as UpdateProductInput);
      }
      return createProductAction(values as unknown as CreateProductInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeProduct === "new" ? "Đã tạo sản phẩm" : "Đã cập nhật sản phẩm"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Slug = slugify(name) directly — mpn is no longer appended separately.
  // The standard naming convention (2026-07-09, see
  // cmd/rename-products-standard) already puts the manufacturer's MPN
  // inside the product name itself for AC products, so concatenating it
  // again onto the slug just duplicated it.
  //
  // Auto-follows name only while creating a brand-new product, where
  // there's no live URL yet to break. Once a product exists, silently
  // rewriting its slug on every later name edit would change the URL a
  // customer/search-engine may already have — see regenerateSlug for the
  // explicit, confirmed edit-mode equivalent (ProductIdentityCard.tsx).
  const updateAutoSlug = (name: string) => {
    if (activeProduct !== "new") return;
    const finalSlug = generateSlug(name);
    if (finalSlug) {
      form.setValue("slug", finalSlug);
    }
  };

  const regenerateSlug = () => {
    const finalSlug = generateSlug(form.getValues("name"));
    if (finalSlug) {
      form.setValue("slug", finalSlug);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploaded: { url: string }[] = [];
    for (const file of Array.from(files)) {
      try {
        const webpFile = await convertToWebP(file);
        const url = await uploadImageFile(webpFile, "products", webpFile.name);
        uploaded.push({ url });
      } catch {
        toast.error(`Lỗi xử lý ảnh: ${file.name}`);
      }
    }

    const currentImages = form.getValues("images") || [];
    form.setValue("images", [...currentImages, ...uploaded]);
    setUploading(false);
    if (uploaded.length > 0) {
      toast.success(`Đã upload ${uploaded.length} ảnh`);
    }
  };

  return {
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
    handleUpload,
    uploading,
  };
}
