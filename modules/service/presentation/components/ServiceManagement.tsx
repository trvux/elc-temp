"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";

import { convertToWebP } from "@/shared/lib/image";
import { createClient } from "@/shared/lib/supabase/client";
import { extractTitleFromHtml, generateSlug } from "@/shared/lib/utils";

import { Service, createServiceSchema } from "../../domain";
import {
  createServiceAction,
  deleteServiceAction,
  getServicesAction,
  updateServiceAction,
} from "../actions";
import { getServiceColumns } from "./ServiceColumns";

type ServiceFormValues = {
  title: string;
  slug: string;
  image: string;
  content: string; // Tiptap handles content as HTML string
  isPublished: boolean;
  orderIndex: number;
};

export function ServiceManagement() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Filters
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  const form = useForm<ServiceFormValues>({
    resolver: standardSchemaResolver(createServiceSchema as any) as any,
    defaultValues: {
      title: "",
      slug: "",
      image: "",
      content: "",
      isPublished: true,
      orderIndex: 0,
    },
  });

  // Fetch Data
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await getServicesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      if (editing) {
        return updateServiceAction({
          ...values,
          id: editing.id,
        });
      }
      return createServiceAction(values);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editing ? "Đã cập nhật dịch vụ" : "Đã tạo dịch vụ");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteServiceAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa dịch vụ");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  async function handleDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId);
  }

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? s.isPublished : !s.isPublished);
      return matchPublished;
    });
  }, [services, filterIsPublished]);

  const columns = useMemo(
    () =>
      getServiceColumns({
        onEdit: (s) => openEdit(s),
        onDelete: (id) => {
          setDeletingId(id);
          setDeleteOpen(true);
        },
      }),
    [],
  );

  function openCreate() {
    setEditing(null);
    form.reset({
      title: "",
      slug: "",
      image: "",
      content: "",
      isPublished: true,
      orderIndex: 0,
    });
    setOpen(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    form.reset({
      title: s.title,
      slug: s.slug,
      image: s.image,
      content: s.content as any,
      isPublished: s.isPublished,
      orderIndex: s.orderIndex,
    });
    setOpen(true);
  }

  const supabase = createClient();
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const webpFile = await convertToWebP(file);
      const fileName = `services/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });

      if (error) throw error;

      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      form.setValue("image", data.publicUrl);
      toast.success("Đã tải lên ảnh đại diện");
    } catch (error) {
      toast.error("Lỗi tải ảnh");
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dịch vụ
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các dịch vụ và nội dung bài viết.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm dịch vụ
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select value={filterIsPublished} onValueChange={setFilterIsPublished}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hiển thị</SelectItem>
            <SelectItem value="false">Đang ẩn</SelectItem>
          </SelectContent>
        </Select>

        {filterIsPublished !== "all" && (
          <Button
            variant="ghost"
            onClick={() => setFilterIsPublished("all")}
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredServices}
        isLoading={isLoading}
        searchKey="title"
        searchPlaceholder="Tìm kiếm tên dịch vụ..."
      />

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        size="full"
        title={editing ? `Sửa: ${editing.title}` : "Thêm dịch vụ mới"}
        description="Cấu hình nội dung chi tiết cho dịch vụ."
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="space-y-8"
        >
          <FieldGroup>
            <div className="bg-muted/10 p-6 rounded-2xl border border-border/40 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field className="md:col-span-2">
                  <FieldLabel className="mb-2 font-medium text-primary">
                    Slug (URL) *
                  </FieldLabel>
                  <FieldContent>
                    <Controller
                      control={form.control}
                      name="slug"
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            placeholder="ten-dich-vu-viet-tat"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, "-")
                                  .replace(/-+/g, "-"),
                              )
                            }
                          />
                          <FieldDescription>
                            Đường dẫn:{" "}
                            <span className="font-medium text-primary">
                              /dich-vu/{field.value || "slug"}
                            </span>
                          </FieldDescription>
                          <FieldError errors={[fieldState.error]} />
                        </>
                      )}
                    />
                  </FieldContent>
                </Field>
              </div>

              <Field>
                <FieldLabel className="mb-2 font-medium">
                  Ảnh đại diện
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <div className="flex flex-col gap-4">
                        {field.value ? (
                          <div className="relative w-40 aspect-video rounded-lg overflow-hidden border">
                            <Image
                              src={field.value}
                              alt="Thumbnail"
                              fill
                              className="object-cover"
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => field.onChange("")}
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-40 aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload
                              size={20}
                              className="text-muted-foreground mb-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              {uploading ? "Đang tải..." : "Tải ảnh lên"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploading}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="mb-2 font-medium text-foreground/80">
                  Nội dung bài viết
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <TiptapEditor
                        value={field.value as any}
                        onChange={(val) => {
                          field.onChange(val);
                          const title = extractTitleFromHtml(val);
                          if (title) {
                            form.setValue("title", title);
                            if (!editing) {
                              form.setValue("slug", generateSlug(title));
                            }
                          }
                        }}
                        placeholder="Bắt đầu viết nội dung..."
                        uploadImage={async (file) => {
                          const webpFile = await convertToWebP(file);
                          const fileName = `services/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
                          const { error } = await supabase.storage
                            .from("images")
                            .upload(fileName, webpFile, {
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
                </FieldContent>
              </Field>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-6">
                  <Field
                    orientation="horizontal"
                    className="w-auto gap-3 flex items-center"
                  >
                    <FieldLabel className="w-auto mb-0 font-medium">
                      Hiển thị
                    </FieldLabel>
                    <FieldContent className="flex items-center min-h-0">
                      <Controller
                        control={form.control}
                        name="isPublished"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>

                  <Field
                    orientation="horizontal"
                    className="w-auto gap-3 flex items-center"
                  >
                    <FieldLabel className="w-auto mb-0 font-medium">
                      Thứ tự
                    </FieldLabel>
                    <FieldContent className="flex items-center min-h-0">
                      <Controller
                        control={form.control}
                        name="orderIndex"
                        render={({ field }) => (
                          <Input
                            type="number"
                            className="w-20 h-9"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="h-9"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="h-9"
                    disabled={saveMutation.isPending}
                  >
                    {editing ? "Cập nhật" : "Tạo mới"}
                  </Button>
                </div>
              </div>
            </div>
          </FieldGroup>
        </form>
      </AdminDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
