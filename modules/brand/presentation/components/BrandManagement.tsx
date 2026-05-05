"use client";

import { useState, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { DataTable } from "@/shared/components/ui/data-table";
import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { generateSlug } from "@/shared/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { z } from "zod";
import Image from "next/image";
import { createClient } from "@/shared/lib/supabase/client";
import { convertToWebP } from "@/shared/lib/image";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import {
  getBrandsAction,
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
} from "../actions";
import { getBrandColumns } from "./BrandColumns";
import { Brand, createBrandSchema, CreateBrandInput, UpdateBrandInput } from "../../domain";

type BrandFormValues = z.infer<typeof createBrandSchema>;

export function BrandManagement() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<BrandFormValues>({
    resolver: standardSchemaResolver(createBrandSchema),
    defaultValues: {
      name: "",
      slug: "",
      logoUrl: "",
      description: "",
    },
  });

  // Fetch brands
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await getBrandsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Create/Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (values: BrandFormValues) => {
      if (editing) {
        return updateBrandAction({
          ...values,
          id: editing.id,
        } as UpdateBrandInput);
      }
      return createBrandAction(values as CreateBrandInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editing ? "Đã cập nhật thương hiệu" : "Đã tạo thương hiệu");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Đã có lỗi xảy ra");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteBrandAction(id);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa thương hiệu");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Đã có lỗi xảy ra");
    },
  });

  const columns = useMemo(
    () =>
      getBrandColumns({
        onEdit: (b) => openEdit(b),
        onDelete: openDelete,
      }),
    []
  );

  function openCreate() {
    setEditing(null);
    form.reset({
      name: "",
      slug: "",
      logoUrl: "",
      description: "",
    });
    setOpen(true);
  }

  function openEdit(b: Brand) {
    setEditing(b);
    form.reset({
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl || "",
      description: b.description || "",
    });
    setOpen(true);
  }

  const onSave = (values: BrandFormValues) => {
    saveMutation.mutate(values);
  };

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId);
  }

  const supabase = createClient();
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const webpFile = await convertToWebP(file);
      const fileName = `brands/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });
      
      if (error) throw error;
      
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      form.setValue("logoUrl", data.publicUrl);
      toast.success("Đã tải logo lên thành công");
    } catch (error) {
      toast.error("Lỗi upload logo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Thương hiệu</h1>
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
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Sửa thương hiệu" : "Thêm thương hiệu"}
        description="Nhập thông tin hãng sản xuất."
      >
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Field>
                  <FieldLabel className="mb-2 font-medium">Tên thương hiệu *</FieldLabel>
                  <FieldContent>
                    <Controller
                      control={form.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            placeholder="VD: Daikin"
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              if (!editing) {
                                form.setValue("slug", generateSlug(e.target.value));
                              }
                            }}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </>
                      )}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel className="mb-2 font-medium">Slug (Tự động)</FieldLabel>
                  <FieldContent>
                    <Controller
                      control={form.control}
                      name="slug"
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            placeholder="vd: daikin"
                          />
                          <FieldError errors={[fieldState.error]} />
                        </>
                      )}
                    />
                  </FieldContent>
                </Field>
              </div>

              <Field>
                <FieldLabel className="mb-2 font-medium">Logo thương hiệu</FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-full aspect-square border-2 border-dashed rounded-xl flex items-center justify-center bg-muted/20 relative overflow-hidden group">
                          {field.value ? (
                            <>
                              <Image src={field.value} alt="Logo" fill className="object-contain p-4" />
                              <button
                                type="button"
                                onClick={() => field.onChange("")}
                                className="absolute top-2 right-2 bg-background/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Upload size={24} />
                              <span className="text-xs">Chưa có logo</span>
                            </div>
                          )}
                        </div>
                        <Button variant="outline" type="button" className="w-full relative" disabled={uploading}>
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={handleUpload}
                          />
                          {uploading ? "Đang tải..." : "Tải logo lên"}
                        </Button>
                      </div>
                    )}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium text-foreground">Mô tả ngắn về hãng (Tùy chọn)</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="VD: Thương hiệu máy lạnh hàng đầu Nhật Bản"
                    />
                  )}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </div>
        </form>
      </AdminDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Xóa thương hiệu?"
        description="Hành động này không thể hoàn tác. Thương hiệu sẽ bị xóa vĩnh viễn khỏi hệ thống."
      />
    </div>
  );
}
