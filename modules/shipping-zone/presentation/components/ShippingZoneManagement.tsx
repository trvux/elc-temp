"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";

import { ShippingZone } from "../../domain";
import { deleteShippingZoneAction, getShippingZonesAction } from "../actions";
import { getShippingZoneColumns } from "./ShippingZoneColumns";
import { ProvinceMultiSelect } from "./ProvinceMultiSelect";
import { WardMultiSelect } from "./WardMultiSelect";
import { useShippingZoneForm } from "../hooks/useShippingZoneForm";

export function ShippingZoneManagement() {
  const queryClient = useQueryClient();
  const [activeZone, setActiveZone] = useState<ShippingZone | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["shipping-zones"],
    queryFn: async () => {
      const { data, error } = await getShippingZonesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { form, saveMutation } = useShippingZoneForm(activeZone, () => setActiveZone(null));
  const selectedProvinceCodes = form.watch("provinceCodes") ?? [];

  const deleteMutation = useMutation({
    mutationFn: deleteShippingZoneAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa khu vực giao hàng");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
  });

  const columns = useMemo(
    () =>
      getShippingZoneColumns({
        onEdit: (z) => {
          setActiveZone(z);
          form.reset({
            name: z.name,
            feeVnd: z.feeVnd,
            minDays: z.minDays,
            maxDays: z.maxDays,
            isDefault: z.isDefault,
            provinceCodes: z.provinceCodes,
            wardCodes: z.wardCodes,
          });
        },
        onDelete: setDeletingId,
      }),
    [form]
  );

  function openCreate() {
    setActiveZone("new");
    form.reset({
      name: "",
      feeVnd: 0,
      minDays: 1,
      maxDays: 3,
      isDefault: false,
      provinceCodes: [],
      wardCodes: [],
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khu vực giao hàng</h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình phí và thời gian giao hàng theo tỉnh/thành — dùng cho hiển thị trên trang sản phẩm và dữ liệu SEO.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm khu vực
        </Button>
      </div>

      <DataTable columns={columns} data={zones} isLoading={isLoading} searchKey="name" searchPlaceholder="Tìm khu vực..." />

      <AdminDialog
        open={!!activeZone}
        onOpenChange={(open) => !open && setActiveZone(null)}
        title={activeZone === "new" ? "Thêm khu vực giao hàng" : "Sửa khu vực giao hàng"}
        description="Một tỉnh/thành có thể thuộc nhiều khu vực — khu vực có chọn phường/xã cụ thể sẽ được ưu tiên khớp trước, khu vực không chọn phường/xã nào là mặc định cho cả tỉnh."
      >
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="flex flex-col gap-6 p-6">
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field className="md:col-span-2">
                  <FieldLabel>Tên khu vực *</FieldLabel>
                  <Input {...field} placeholder="VD: Nội thành TP.HCM" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="feeVnd"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Phí giao (VNĐ)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                  <FieldDescription>Nhập 0 nếu miễn phí giao hàng.</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <Field className="flex flex-col justify-between border p-4 rounded-xl bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FieldLabel className="text-sm font-medium">Khu vực mặc định</FieldLabel>
                      <FieldDescription className="text-[11px] leading-tight">
                        Áp dụng cho tỉnh/thành chưa cấu hình khu vực nào.
                      </FieldDescription>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="minDays"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Số ngày giao tối thiểu</FieldLabel>
                  <Input type="number" min={0} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="maxDays"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Số ngày giao tối đa</FieldLabel>
                  <Input type="number" min={0} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="provinceCodes"
              render={({ field, fieldState }) => (
                <Field className="md:col-span-2">
                  <FieldLabel>Tỉnh/thành áp dụng</FieldLabel>
                  <ProvinceMultiSelect value={field.value ?? []} onChange={field.onChange} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="wardCodes"
              render={({ field }) => (
                <Field className="md:col-span-2">
                  <FieldLabel>Phường/xã cụ thể (tùy chọn)</FieldLabel>
                  <WardMultiSelect
                    provinceCodes={selectedProvinceCodes}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                  <FieldDescription>
                    Để trống nếu khu vực này áp dụng cho toàn bộ tỉnh/thành đã chọn ở trên. Nếu chọn phường/xã cụ thể,
                    khu vực chỉ khớp khi khách chọn đúng phường/xã đó.
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="ghost" type="button" onClick={() => setActiveZone(null)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </div>
        </form>
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
