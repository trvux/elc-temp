import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createShippingZoneSchema, ShippingZone, CreateShippingZoneInput, UpdateShippingZoneInput } from "../../domain";
import { createShippingZoneAction, updateShippingZoneAction } from "../actions";

export type ShippingZoneFormValues = z.infer<typeof createShippingZoneSchema>;

export function useShippingZoneForm(activeZone: ShippingZone | "new" | null, onClose: () => void) {
  const queryClient = useQueryClient();

  const form = useForm<ShippingZoneFormValues>({
    resolver: standardSchemaResolver(createShippingZoneSchema),
    defaultValues: {
      name: "",
      feeVnd: 0,
      minDays: 1,
      maxDays: 3,
      isDefault: false,
      provinceCodes: [],
      wardCodes: [],
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ShippingZoneFormValues) => {
      if (activeZone && activeZone !== "new") {
        return updateShippingZoneAction({ ...values, id: activeZone.id } as UpdateShippingZoneInput);
      }
      return createShippingZoneAction(values as CreateShippingZoneInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(activeZone === "new" ? "Đã tạo khu vực giao hàng" : "Đã cập nhật khu vực giao hàng");
      onClose();
      queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
  });

  return { form, saveMutation };
}
