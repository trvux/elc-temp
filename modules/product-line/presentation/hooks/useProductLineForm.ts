import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createProductLineSchema, ProductLine, CreateProductLineInput, UpdateProductLineInput } from "../../domain";
import { createProductLineAction, updateProductLineAction } from "../actions";

export type ProductLineFormValues = z.infer<typeof createProductLineSchema>;

export function useProductLineForm(
  activeLine: ProductLine | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();

  const form = useForm<ProductLineFormValues>({
    // See useProductForm.ts for the same cast — z.coerce.number().default(...)
    // fields make standardSchemaResolver's inferred input/output types
    // diverge just enough that TS can't unify them without this.
    resolver: standardSchemaResolver(createProductLineSchema) as unknown as Resolver<ProductLineFormValues>,
    defaultValues: {
      brandId: "",
      categoryId: null,
      code: "",
      name: "",
      tierRank: 0,
      description: "",
      mpnPrefixes: [],
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ProductLineFormValues) => {
      if (activeLine && activeLine !== "new") {
        return updateProductLineAction({
          id: activeLine.id,
          categoryId: values.categoryId,
          name: values.name,
          tierRank: values.tierRank,
          description: values.description,
          mpnPrefixes: values.mpnPrefixes,
        } as UpdateProductLineInput);
      }
      return createProductLineAction(values as CreateProductLineInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeLine === "new" ? "Đã tạo dòng sản phẩm" : "Đã cập nhật dòng sản phẩm"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["product-lines"] });
    },
  });

  return { form, saveMutation };
}
