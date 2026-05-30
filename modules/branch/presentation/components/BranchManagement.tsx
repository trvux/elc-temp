"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/components/ui/field";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { capitalize, generateSlug } from "@/shared/lib/helpers";

import { Branch } from "../../domain";
import { deleteBranchAction, getBranchesAction } from "../actions";
import { useBranchForm } from "../hooks/useBranchForm";
import { getBranchColumns } from "./BranchColumns";

export function BranchManagement() {
  const queryClient = useQueryClient();
  const [activeBranch, setActiveBranch] = useState<Branch | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Data
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await getBranchesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Custom Form Hook
  const { form, saveMutation, supabase } =
    useBranchForm(activeBranch, () => setActiveBranch(null));

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBranchAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa chi nhánh");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  const columns = useMemo(
    () =>
      getBranchColumns({
        onEdit: (b) => {
          setActiveBranch(b);
          let description = (b.description as string) || "";
          if (
            typeof description === "string" &&
            !description.includes("<h1") &&
            b.name
          ) {
            description = `<h1>${b.name}</h1>${description}`;
          }
          form.reset({
            name: b.name,
            slug: b.slug,
            address: b.address || "",
            phone: b.phone || "",
            email: b.email || "",
            mapsUrl: b.mapsUrl || "",
            mapsEmbed: b.mapsEmbed || "",
            description,
            imageUrl: b.imageUrl || "",
            isPublished: b.isPublished,
            metaTitle: b.metaTitle || "",
            metaDescription: b.metaDescription || "",
            orderIndex: b.orderIndex,
          });
        },
        onDelete: setDeletingId,
      }),
    [form],
  );

  function openCreate() {
    setActiveBranch("new");
    form.reset({
      name: "",
      slug: "",
      address: "",
      phone: "",
      email: "",
      mapsUrl: "",
      mapsEmbed: "",
      description: "",
      imageUrl: "",
      isPublished: true,
      metaTitle: "",
      metaDescription: "",
      orderIndex: 0,
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chi nhánh</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý địa điểm chi nhánh và thông tin liên hệ.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm chi nhánh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={branches}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm kiếm tên, địa chỉ..."
      />

      <AdminDialog
        open={!!activeBranch}
        onOpenChange={(open) => !open && setActiveBranch(null)}
        size="full"
        title={activeBranch === "new" ? "Thêm chi nhánh" : "Sửa chi nhánh"}
        description="Điền thông tin chi nhánh để hiển thị trên website."
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-5 space-y-6">
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Tên chi nhánh *</FieldLabel>
                        <Input
                          {...field}
                          placeholder="Văn phòng Quận 1"
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (!form.getValues("slug")) {
                              form.setValue(
                                "slug",
                                generateSlug(e.target.value),
                              );
                            }
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
                        <FieldLabel>Slug / URL Preview</FieldLabel>
                        <Input
                          {...field}
                          placeholder="van-phong-quan-1"
                          onChange={(e) =>
                            field.onChange(generateSlug(e.target.value))
                          }
                        />
                        <FieldDescription className="flex items-center gap-2">
                          <ExternalLink size={12} />
                          /chi-nhanh/{field.value || "..."}
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <Field
                          orientation="horizontal"
                          className="justify-between border p-3 rounded-xl"
                        >
                          <FieldLabel className="font-normal">
                            Hiển thị
                          </FieldLabel>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="orderIndex"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Thứ tự</FieldLabel>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </Field>
                      )}
                    />
                  </div>

                  <Controller
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Ảnh đại diện chi nhánh</FieldLabel>
                        <ImageUpload
                          value={field.value || ""}
                          onChange={field.onChange}
                          aspectRatio={1.6}
                          folderPath="branches"
                        />
                      </Field>
                    )}
                  />
                </div>

                {/* Right Column: Contact Info */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Controller
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Số điện thoại</FieldLabel>
                          <Input {...field} placeholder="0909 123 456" />
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Email</FieldLabel>
                          <Input {...field} placeholder="contact@company.com" />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </div>

                  <Controller
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Địa chỉ chi tiết</FieldLabel>
                        <Input
                          {...field}
                          placeholder="Số 123, Đường ABC, Quận..."
                          onChange={(e) =>
                            field.onChange(capitalize(e.target.value))
                          }
                        />
                      </Field>
                    )}
                  />
                </div>
              </div>

              {/* Maps Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">
                    Vị trí & Bản đồ
                  </h3>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Google Maps Integration
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-5">
                    <Controller
                      control={form.control}
                      name="mapsUrl"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Link Google Maps</FieldLabel>
                          <Textarea
                            {...field}
                            // className="resize-none"
                            placeholder="https://maps.google.com/..."
                            rows={1}
                          />
                          <FieldDescription>
                            Dùng để mở ứng dụng Bản đồ trên điện thoại.
                          </FieldDescription>
                        </Field>
                      )}
                    />
                  </div>
                  <div className="md:col-span-7">
                    <Controller
                      control={form.control}
                      name="mapsEmbed"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Maps Embed (URL/iframe)</FieldLabel>
                          <Textarea
                            {...field}
                            // className="resize-none"
                            placeholder="Dán iframe hoặc URL từ Google Maps..."
                            onChange={(e) => {
                              const val = e.target.value;
                              const match = val.match(/src="([^"]+)"/);
                              field.onChange(match ? match[1] : val);
                            }}
                            rows={1}
                          />
                          <FieldDescription>
                            Dùng để hiển thị bản đồ trực tiếp trên website.
                          </FieldDescription>
                        </Field>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="space-y-6 border p-6 rounded-2xl bg-muted/10">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-semibold tracking-tight">Cấu hình SEO</h3>
                  <p className="text-[11px] text-muted-foreground">Tối ưu hóa hiển thị trên các công cụ tìm kiếm (Google, Bing,...).</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    control={form.control}
                    name="metaTitle"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Tiêu đề SEO</FieldLabel>
                        <Input {...field} value={field.value || ""} placeholder="Để trống sẽ tự động dùng tiêu đề..." />
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
                        <Textarea {...field} value={field.value || ""} placeholder="Mô tả tóm tắt chi nhánh để hiển thị trên Google..." className="min-h-[80px]" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>
              </div>

              {/* Editor Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold tracking-tight">
                    Giới thiệu chi nhánh
                  </h3>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Tiptap Editor
                  </span>
                </div>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <TiptapEditor
                      key={activeBranch === "new" ? "new" : (activeBranch as Branch)?.id}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Viết nội dung giới thiệu chi nhánh..."
                      uploadImage={async (file) => {
                        const fileName = `branches/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
                        const { error } = await supabase.storage
                          .from("images")
                          .upload(fileName, file, {
                            contentType: "image/webp",
                          });
                        if (error) throw error;
                        const { data } = supabase.storage
                          .from("images")
                          .getPublicUrl(fileName);
                        return data.publicUrl;
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
            <Button
              variant="outline"
              type="button"
              onClick={() => setActiveBranch(null)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Đang lưu..."
                : activeBranch === "new"
                  ? "Tạo chi nhánh"
                  : "Lưu thay đổi"}
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
