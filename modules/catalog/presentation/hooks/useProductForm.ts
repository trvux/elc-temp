import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { convertToWebP } from "@/shared/lib/image";
import { createClient } from "@/shared/lib/supabase/client";
import { generateSlug } from "@/shared/lib/helpers";

import { createProductSchema, ProductWithRelations, STOCK_STATUS, PRODUCT_CONDITION, SpecItem, SpecSubItem, CreateProductInput, UpdateProductInput } from "../../domain";
import { createProductAction, updateProductAction } from "../actions";

export type ProductFormValues = Omit<
  z.infer<typeof createProductSchema>,
  "description" | "specs"
> & {
  description: unknown;
  specs: SpecItem[];
};



export const AC_TEMPLATE: SpecItem[] = [
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

export function useProductForm(
  activeProduct: ProductWithRelations | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const form = useForm<ProductFormValues>({
    resolver: standardSchemaResolver(createProductSchema) as unknown as Resolver<ProductFormValues>,
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
      labels: [],
      isFeatured: false,
      isPublished: true,
      orderIndex: 0,
      categoryId: "",
      brandId: "",
      stockStatus: STOCK_STATUS.IN_STOCK,
      condition: PRODUCT_CONDITION.NEW,
      mpn: "",
      gtin: "",
      metaTitle: "",
      metaDescription: "",
      specs: AC_TEMPLATE,
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

  const appendSpecItem = (index: number, item: SpecSubItem) => {
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

  const updateAutoSlug = (
    name: string,
    mpn: string,
  ) => {
    // Formula: slug(name) + "-" + slug(mpn)
    const parts: string[] = [];
    if (name) parts.push(generateSlug(name));
    if (mpn) parts.push(generateSlug(mpn));

    const finalSlug = parts.join("-").trim();

    if (finalSlug) {
      form.setValue("slug", finalSlug);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const webpFile = await convertToWebP(file);
        const fileName = `products/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.webp`;
        const { error } = await supabase.storage
          .from("images")
          .upload(fileName, webpFile, { contentType: "image/webp" });
        if (error) {
          toast.error(`Lỗi upload: ${file.name}`);
          continue;
        }
        const { data } = supabase.storage.from("images").getPublicUrl(fileName);
        uploaded.push(data.publicUrl);
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
    specsFields,
    appendSpec,
    removeSpec,
    appendSpecItem,
    removeSpecItem,
    saveMutation,
    updateAutoSlug,
    handleUpload,
    uploading,
  };
}
