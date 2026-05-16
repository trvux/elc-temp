import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { convertToWebP } from "@/shared/lib/image";
import { createClient } from "@/shared/lib/supabase/client";
import { generateSlug } from "@/shared/lib/utils";

import { createProductSchema, ProductWithRelations, STOCK_STATUS, Brand } from "../../domain";
import { createProductAction, updateProductAction } from "../actions";

export type ProductFormValues = Omit<
  z.infer<typeof createProductSchema>,
  "description" | "specs"
> & {
  description: any;
  specs: any;
};

export type SpecSubItem = {
  label: string;
  value: string;
  unit?: string;
};

export type SpecItem = {
  label: string;
  value?: string;
  items?: SpecSubItem[];
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
  onClose: () => void,
  brands: Brand[] = []
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

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
        activeProduct === "new" ? "Đã tạo sản phẩm" : "Đã cập nhật sản phẩm"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const updateAutoSlug = (
    name: string,
    sku: string,
    catId: string,
    brdId: string,
    specs: any[] = []
  ) => {
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

    // Formula: [hp]hp-[sku]
    let parts = [];
    if (hpValue) parts.push(`${hpValue}hp`);
    if (cleanedSku) parts.push(cleanedSku);

    const finalPart = parts.join("-").trim();

    if (finalPart) {
      form.setValue("slug", generateSlug(finalPart));
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
      } catch (err) {
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
