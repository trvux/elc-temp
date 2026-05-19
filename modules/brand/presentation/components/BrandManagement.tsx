"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

import { Brand } from "../../domain";
import { deleteBrandAction, getBrandsAction } from "../actions";
import { getBrandColumns } from "./BrandColumns";
import { useBrandForm } from "../hooks/useBrandForm";

export function BrandManagement() {
  const queryClient = useQueryClient();
  const [activeBrand, setActiveBrand] = useState<Brand | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch brands
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await getBrandsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Custom Form Hook
  const { form, saveMutation, handleUpload, uploading, onNameChange } =
    useBrandForm(activeBrand, () => setActiveBrand(null));

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBrandAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa thương hiệu");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  const columns = useMemo(
    () =>
      getBrandColumns({
        onEdit: (b) => {
          setActiveBrand(b);
          form.reset({
            name: b.name,
            slug: b.slug,
            logoUrl: b.logoUrl || "",
            description: b.description || "",
            metaTitle: b.metaTitle || "",
            metaDescription: b.metaDescription || "",
          });
        },
        onDelete: setDeletingId,
      }),
    [form]
  );

  function openCreate() {
    setActiveBrand("new");
    form.reset({
      name: "",
      slug: "",
      logoUrl: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thương hiệu</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các hãng sản xuất và cung cấp sản phẩm.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm thương hiệu
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={brands}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm kiếm thương hiệu..."
      />

      <AdminDialog
        open={!!activeBrand}
        onOpenChange={(open) => !open && setActiveBrand(null)}
        title={activeBrand === "new" ? "Thêm thương hiệu" : "Sửa thương hiệu"}
        description="Nhập thông tin hãng sản xuất."
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex flex-col gap-6"
        >
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-5">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Tên thương hiệu *</FieldLabel>
                    <Input
                      {...field}
                      placeholder="VD: Daikin"
                      onChange={(e) => onNameChange(e.target.value)}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="slug"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Slug (Tự động)</FieldLabel>
                    <Input {...field} placeholder="vd: daikin" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Mô tả ngắn (Tùy chọn)</FieldLabel>
                    <Input
                      {...field}
                      placeholder="VD: Thương hiệu máy lạnh Nhật Bản"
                    />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Logo thương hiệu</FieldLabel>
                  <div className="flex flex-col gap-4">
                    <div className="w-full aspect-square border-2 border-dashed rounded-2xl flex items-center justify-center bg-muted/5 relative overflow-hidden group transition-colors hover:bg-muted/10">
                      {field.value ? (
                        <>
                          <Image
                            src={field.value}
                            alt="Logo"
                            fill
                            className="object-contain p-6"
                            sizes="(max-width: 768px) 100vw, 250px"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => field.onChange("")}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-muted-foreground/60">
                          <Upload size={32} strokeWidth={1.5} />
                          <span className="text-xs font-medium uppercase tracking-wider">
                            Chưa có logo
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full relative overflow-hidden"
                      disabled={uploading}
                    >
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleUpload}
                      />
                      {uploading ? "Đang tải..." : "Chọn logo từ máy tính"}
                    </Button>
                  </div>
                </Field>
              )}
            />
          </FieldGroup>

          {/* SEO Section */}
          <div className="space-y-5 border p-5 rounded-2xl bg-muted/10">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold tracking-tight">Cấu hình SEO</h3>
              <p className="text-[11px] text-muted-foreground">Tối ưu hóa hiển thị trên các công cụ tìm kiếm.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Controller
                control={form.control}
                name="metaTitle"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Tiêu đề SEO</FieldLabel>
                    <Input {...field} value={field.value || ""} placeholder="Để trống sẽ tự động dùng tên thương hiệu..." />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="metaDescription"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Mô tả SEO</FieldLabel>
                    <Textarea {...field} value={field.value || ""} placeholder="Mô tả tóm tắt thương hiệu hiển thị trên Google..." className="min-h-[80px]" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setActiveBrand(null)}
            >
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
