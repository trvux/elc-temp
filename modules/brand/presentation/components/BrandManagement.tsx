"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowSquareOut } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { ImageUpload } from "@/shared/components/ui/image-upload";

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
  const { form, saveMutation, onNameChange } =
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
            isFeatured: !!b.isFeatured,
            orderIndex: b.orderIndex || 0,
            metaTitle: b.metaTitle || "",
            metaDescription: b.metaDescription || "",
            content: b.content || "",
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
      isFeatured: false,
      orderIndex: 0,
      metaTitle: "",
      metaDescription: "",
      content: "",
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
        description="Nhập thông tin hãng sản xuất và cấu hình SEO."
        size="full"
      >
        <Tabs defaultValue="info" className="flex flex-col flex-1 min-h-0 relative w-full">
          {/* Centered Sticky Header Tabs */}
          <div className="flex sticky top-0 z-20 w-full items-center justify-center border-b bg-background/95 py-4 backdrop-blur">
            <TabsList>
              <TabsTrigger value="info">Thông tin chung</TabsTrigger>
              <TabsTrigger value="seo">Cấu hình SEO</TabsTrigger>
              <TabsTrigger value="content">Bài viết</TabsTrigger>
            </TabsList>
          </div>

          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0">
            <form
              onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
              className="flex-1 flex flex-col min-h-0 w-full"
            >
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                <TabsContent value="info" className="m-0 space-y-6">
                  <FieldGroup className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-8 flex flex-col gap-5">
                      <Controller
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Tên thương hiệu *</FieldLabel>
                            <Input
                              {...field}
                              placeholder="VD: Daikin"
                              onChange={(e) => {
                                onNameChange(e.target.value);
                                field.onChange(e);
                              }}
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
                            <FieldLabel>Slug / Đường dẫn (Tự động)</FieldLabel>
                            <Input {...field} placeholder="vd: daikin" />
                            <FieldDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <ArrowSquareOut size={12} />
                              /san-pham/all/{field.value || "..."}
                            </FieldDescription>
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Controller
                          control={form.control}
                          name="orderIndex"
                          render={({ field }) => (
                            <Field>
                              <FieldLabel>Thứ tự hiển thị</FieldLabel>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                              <FieldDescription>Thứ tự sắp xếp nhỏ đến lớn.</FieldDescription>
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="isFeatured"
                          render={({ field }) => (
                            <Field className="flex flex-col justify-between h-[85px] border p-4 rounded-xl bg-muted/10">
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <FieldLabel className="text-sm font-medium">Nổi bật</FieldLabel>
                                  <FieldDescription className="text-[11px] leading-tight">Hiển thị ở trang chủ</FieldDescription>
                                </div>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </div>
                            </Field>
                          )}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-4 flex justify-start md:justify-center">
                      <Controller
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <Field className="max-w-[240px] w-full">
                            <FieldLabel>Upload ảnh</FieldLabel>
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              aspectRatio="1:1"
                              folderPath="brands"
                            />
                          </Field>
                        )}
                      />
                    </div>
                  </FieldGroup>
                </TabsContent>

                <TabsContent value="seo" className="m-0 space-y-6">
                  <div className="max-w-2xl space-y-6">
                    <Controller
                      control={form.control}
                      name="metaTitle"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Tiêu đề SEO</FieldLabel>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Để trống sẽ tự động dùng tên thương hiệu..."
                          />
                          <FieldDescription>
                            Tiêu đề hiển thị trên thanh tiêu đề trình duyệt và kết quả tìm kiếm Google.
                          </FieldDescription>
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
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Mô tả tóm tắt thương hiệu hiển thị trên Google..."
                            className="min-h-[120px] resize-y"
                          />
                          <FieldDescription>
                            Đoạn mô tả ngắn hiển thị dưới tiêu đề trang trên trang kết quả tìm kiếm Google.
                          </FieldDescription>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="content" className="m-0 space-y-8">
                  {/* Editor Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight">Bài viết chi tiết SEO</h3>
                        <p className="text-[11px] text-muted-foreground">Nội dung bài viết hiển thị ở cuối danh sách sản phẩm.</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tiptap Editor</span>
                    </div>
                    <Controller
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <TiptapEditor
                          key={activeBrand === "new" ? "new" : activeBrand?.id}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Bắt đầu viết bài viết tối ưu SEO tại đây..."
                          uploadImage={async (file) => {
                            const webpFile = await convertToWebP(file);
                            return uploadImageFile(webpFile, "brands", webpFile.name);
                          }}
                        />
                      )}
                    />
                  </div>
                </TabsContent>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
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
          </div>
        </Tabs>
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
