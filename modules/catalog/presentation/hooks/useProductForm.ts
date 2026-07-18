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
// Product doc comment in domain/types.ts. Kept blank/mpn-empty; the admin
// fills it in via ProductIdentityCard's flat fields (bound to variants.0.*)
// exactly like the old flat sku/mpn/price fields used to work.
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

export function useProductForm(
  activeProduct: ProductWithRelations | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: standardSchemaResolver(createProductSchema) as unknown as Resolver<ProductFormValues>,
    defaultValues: {
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
      // Every product needs >=1 variant (the Go backend rejects zero — see
      // elc-go's domain.Product doc comment). This default variant is what
      // ProductIdentityCard's flat sku/mpn/gtin/price/stock fields actually
      // bind to (variants.0.*) for the common "no real options" case —
      // see ProductIdentityCard.tsx.
      variants: [DEFAULT_VARIANT],
    },
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
