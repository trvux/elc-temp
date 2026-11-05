"use client";

import { capitalize } from "@/shared/lib/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CreateServiceInput,
  ServiceWithRelations,
  UpdateServiceInput,
} from "../../domain/types";
import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "../actions";
import { SERVICE_LINES, SERVICE_LINE_ORDER, type ServiceLine } from "../../domain/line";
import { useServiceForm } from "../hooks/useServiceForm";
import { getServiceColumns } from "./ServiceColumns";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/organisms/layout/admin/delete-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { SeoSnippetPreview } from "@/shared/components/organisms/layout/admin/seo-snippet-preview";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/shared/components/ui/field";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { Plus, X } from "@phosphor-icons/react";
import { Controller } from "react-hook-form";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { TitleAlignField } from "@/shared/components/ui/title-align-field";
import { uploadImageFile } from "@/shared/lib/upload-image";
import { FAQManager } from "@/modules/faq";

interface ServiceManagementProps {
  initialData: ServiceWithRelations[];
}

export function ServiceManagement({ initialData }: ServiceManagementProps) {
  const [activeService, setActiveService] = useState<
    ServiceWithRelations | "new" | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Filters
  const [filterLine, setFilterLine] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  const filteredServices = useMemo(() => {
    return initialData.filter((s) => {
      const matchLine = filterLine === "all" || s.line === filterLine;
      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? s.isPublished : !s.isPublished);
      return matchLine && matchPublished;
    });
  }, [initialData, filterLine, filterIsPublished]);

  const {
    form,
    getFormData,
    labelInput,
    setLabelInput,
    addLabel,
    removeLabel,
  } = useServiceForm(activeService === "new" ? null : activeService);

  const previewTitle = form.watch("title");
  const previewSlug = form.watch("slug");
  const previewMetaTitle = form.watch("metaTitle");
  const previewMetaDescription = form.watch("metaDescription");

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (data: CreateServiceInput | UpdateServiceInput) => {
      // content (Tiptap JSON) doesn't survive Next.js Server Action argument
      // serialization intact when passed straight from RHF's field value —
      // nested mark/node attrs (e.g. a link's href) silently disappear en
      // route to the server. A JSON round-trip forces a genuinely plain
      // value that serializes correctly — see useProductForm.ts for the
      // same fix with the trace that found it.
      const payload = {
        ...data,
        ...(data.content !== undefined ? { content: JSON.parse(JSON.stringify(data.content)) } : {}),
      };
      if (activeService === "new") {
        return createServiceAction(payload as CreateServiceInput);
      }
      return updateServiceAction(payload as UpdateServiceInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeService === "new"
          ? "Tạo dịch vụ thành công"
          : "Cập nhật thành công",
      );
      setActiveService(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteServiceAction(id);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Xoá thành công");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });

  const onSubmit = form.handleSubmit(() => {
    if (activeService !== "new" && !activeService?.id) return;

    const values = getFormData();
    const formData = {
      ...values,
      ...(activeService !== "new" ? { id: activeService?.id } : {}),
    };

    saveMutation.mutate(formData);
  });

  const columns = getServiceColumns({
    onEdit: (service) => setActiveService(service),
    onDelete: (id) => setDeletingId(id),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="type-title">Dịch vụ</h2>
          <p className="text-muted-foreground mt-1 type-body-sm">
            Quản lý dịch vụ, nhãn hiển thị và thông tin khách cần gửi để được báo giá
          </p>
        </div>
        <Button onClick={() => setActiveService("new")}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm dịch vụ mới
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Line Filter */}
        <Select value={filterLine} onValueChange={setFilterLine}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Mảng dịch vụ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mảng</SelectItem>
            {SERVICE_LINE_ORDER.map((line) => (
              <SelectItem key={line} value={line}>
                {SERVICE_LINES[line].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Published Filter */}
        <Select value={filterIsPublished} onValueChange={setFilterIsPublished}>
          <SelectTrigger className="w-full md:w-38">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hiển thị</SelectItem>
            <SelectItem value="false">Đang ẩn</SelectItem>
          </SelectContent>
        </Select>

        {(filterLine !== "all" || filterIsPublished !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterLine("all");
              setFilterIsPublished("all");
            }}
            className="h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredServices}
        searchKey="title"
        searchPlaceholder="Tìm dịch vụ theo tên..."
      />

      <AdminDialog
        open={activeService !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveService(null);
            form.reset();
          }
        }}
        title={activeService === "new" ? "Thêm Dịch vụ" : "Sửa Dịch vụ"}
        description="Quản lý chi tiết dịch vụ, cấu hình giá bán và SEO."
        size="full"
      >
        <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col min-h-0">
          <form
            id="service-form"
            onSubmit={onSubmit}
            className="flex-1 flex flex-col min-h-full"
          >
            <div className="flex-1 p-6 lg:p-10">
              <div className="max-w-5xl mx-auto space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left Column: Form Fields */}
                  <FieldGroup className="lg:col-span-8 gap-8">
                    <FieldSet>
                      <FieldLegend>Thông tin dịch vụ</FieldLegend>
                      <FieldGroup className="space-y-5">
                        <Controller
                          control={form.control}
                          name="title"
                          render={({ field, fieldState }) => (
                            <Field>
                              <div className="flex items-center justify-between gap-3">
                                <FieldLabel>Tên dịch vụ *</FieldLabel>
                                <TitleAlignField control={form.control} name="titleAlign" />
                              </div>
                              <Input
                                {...field}
                                onChange={(e) =>
                                  field.onChange(capitalize(e.target.value))
                                }
                                placeholder="vd: Thi công lắp đặt máy lạnh"
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
                              <FieldLabel>Đường dẫn (Slug) *</FieldLabel>
                              <Input
                                {...field}
                                placeholder="auto-generated-slug"
                              />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="line"
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Mảng dịch vụ</FieldLabel>
                              <Select
                                value={field.value}
                                onValueChange={(v) => field.onChange(v as ServiceLine)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn mảng" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SERVICE_LINE_ORDER.map((line) => (
                                    <SelectItem key={line} value={line}>
                                      {SERVICE_LINES[line].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="type-legal text-muted-foreground">
                                Quyết định mục trên trang Dịch vụ, chữ trên nút và lời mở đầu tin nhắn Zalo.
                              </span>
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="description"
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>
                                Mô tả ngắn (Hiển thị trên Card)
                              </FieldLabel>
                              <Textarea
                                {...field}
                                value={field.value || ""}
                                placeholder="Vài dòng mô tả về dịch vụ..."
                                rows={3}
                              />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />
                      </FieldGroup>
                    </FieldSet>


                    <FieldSeparator />

                    {/* Brief prompts: the blanks the Zalo message gives the customer. */}
                    <FieldSet>
                      <FieldLegend>Thông tin khách cần gửi để được báo giá</FieldLegend>
                      <Controller
                        control={form.control}
                        name="briefPrompts"
                        render={({ field, fieldState }) => (
                          <Field>
                            <Textarea
                              value={(field.value ?? []).join("\n")}
                              onChange={(e) => field.onChange(e.target.value.split("\n"))}
                              placeholder={"Địa chỉ công trình\nSố tầng và tổng diện tích sàn\nĐã có bản vẽ mặt bằng chưa"}
                              rows={6}
                            />
                            <span className="type-legal text-muted-foreground">
                              Mỗi dòng một ý. Hiện trên trang dịch vụ và thành các dòng để khách điền trong tin nhắn
                              Zalo, để nhân viên báo giá được ngay. Dòng trống sẽ bị bỏ.
                            </span>
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                    </FieldSet>
                  </FieldGroup>

                  {/* Right Column: Image Upload, Display Config, Badges */}
                  <FieldGroup className="lg:col-span-4 gap-8">
                    <FieldSet className="w-full">
                      <FieldLegend>Hình ảnh đại diện</FieldLegend>
                      <Controller
                        control={form.control}
                        name="images"
                        render={({ field, fieldState }) => {
                          const current = field.value?.[0];
                          return (
                            <Field className="w-full">
                              <ImageUpload
                                value={current?.url || ""}
                                onChange={(url) =>
                                  field.onChange(url ? [{ ...current, url }] : [])
                                }
                                aspectRatio={4 / 3}
                                folderPath="services"
                              />
                              {current?.url && (
                                <>
                                  <Input
                                    value={current.alt || ""}
                                    onChange={(e) =>
                                      field.onChange([{ ...current, alt: e.target.value }])
                                    }
                                    placeholder="Mô tả ảnh (alt text, bắt buộc khi công khai)"
                                    className="mt-2 type-legal h-8"
                                  />
                                  <Input
                                    value={current.caption || ""}
                                    onChange={(e) =>
                                      field.onChange([{ ...current, caption: e.target.value }])
                                    }
                                    placeholder="Chú thích ảnh (caption, hiện dưới ảnh, bắt buộc khi công khai)"
                                    className="mt-2 type-legal h-8"
                                  />
                                </>
                              )}
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          );
                        }}
                      />
                    </FieldSet>

                    <FieldSeparator />

                    <FieldSet>
                      <FieldLegend>Cấu hình hiển thị</FieldLegend>
                      <FieldGroup className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <Controller
                            control={form.control}
                            name="isPublished"
                            render={({ field, fieldState }) => (
                              <Field>
                                <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/10 h-full">
                                  <div className="space-y-0.5">
                                    <FieldLabel className="type-label">
                                      Hiển thị
                                    </FieldLabel>
                                    <span className="type-legal text-muted-foreground block">
                                      Công khai
                                    </span>
                                  </div>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </div>
                                <FieldError errors={[fieldState.error]} />
                              </Field>
                            )}
                          />
                        </div>

                        <Controller
                          control={form.control}
                          name="orderIndex"
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Thứ tự hiển thị</FieldLabel>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />
                      </FieldGroup>
                    </FieldSet>

                    <FieldSeparator />

                    <FieldSet>
                      <FieldLegend>Nhãn hiển thị (Badges)</FieldLegend>
                      <div className="border rounded-xl p-5 bg-muted/5 space-y-3">
                        <div className="space-y-1">
                          <p className="type-legal text-muted-foreground">
                            Ví dụ: Bảo hành 1 năm, Khảo sát miễn phí...
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={labelInput}
                            onChange={(e) => setLabelInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addLabel();
                              }
                            }}
                            placeholder="Nhập nhãn..."
                            className="h-9"
                          />
                          <Button
                            type="button"
                            onClick={addLabel}
                            size="sm"
                            className="h-9 px-3"
                          >
                            Thêm
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {form.watch("labels")?.map((label) => (
                            <Badge
                              key={label}
                              variant="secondary"
                              className="pl-2.5 pr-1 py-1 gap-1"
                            >
                              {label}
                              <button
                                type="button"
                                onClick={() => removeLabel(label)}
                                className="h-4 w-4 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                          ))}
                          {(!form.watch("labels") ||
                            form.watch("labels")?.length === 0) && (
                            <span className="type-legal text-muted-foreground italic">
                              Chưa có nhãn dán nào
                            </span>
                          )}
                        </div>
                      </div>
                    </FieldSet>
                  </FieldGroup>
                </div>

                {/* SEO Section */}
                <div className="space-y-6 border p-6 rounded-2xl bg-muted/10">
                  <div className="border-b pb-2">
                    <h3 className="type-label">
                      Cấu hình SEO
                    </h3>
                    <p className="type-legal text-muted-foreground">
                      Tối ưu hóa hiển thị trên các công cụ tìm kiếm.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Controller
                      control={form.control}
                      name="metaTitle"
                      render={({ field, fieldState }) => (
                        <Field>
                          <div className="flex items-center justify-between">
                            <FieldLabel className="type-legal">
                              Tiêu đề SEO
                            </FieldLabel>
                            <span className="type-legal text-muted-foreground">{(field.value || "").length}/70</span>
                          </div>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Để trống sẽ tự động dùng tên dịch vụ..."
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="metaDescription"
                      render={({ field, fieldState }) => (
                        <Field>
                          <div className="flex items-center justify-between">
                            <FieldLabel className="type-legal">Mô tả SEO</FieldLabel>
                            <span className="type-legal text-muted-foreground">{(field.value || "").length}/160</span>
                          </div>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Mô tả tóm tắt dịch vụ để hiển thị trên Google..."
                            className="min-h-20"
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </div>
                  <SeoSnippetPreview
                    title={previewMetaTitle || previewTitle || ""}
                    description={previewMetaDescription || ""}
                    url={`dienmayelc.com.vn/dich-vu/${previewSlug || ""}`}
                  />
                </div>

                {/* Editor Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="type-label">Nội dung chi tiết dịch vụ</h3>
                    <span className="type-legal text-muted-foreground uppercase">Tiptap</span>
                  </div>
                  <Controller
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <TiptapEditor
                        key={activeService === "new" ? "new" : activeService?.id}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Bắt đầu viết nội dung chi tiết dịch vụ..."
                        uploadImage={async (file: File) => uploadImageFile(file, "services")}
                      />
                    )}
                  />
                </div>

                {/* FAQ Section — chỉ hiện khi sửa dịch vụ đã tồn tại (cần
                    có id thật làm owner_id, xem mã 8823). Câu hỏi cụ thể
                    (mã lỗi, cách xử lý...) ở đây tăng khả năng được AI
                    Overview/answer engine trích dẫn trực tiếp. */}
                {activeService !== "new" && activeService?.id && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="type-label">
                        Câu hỏi thường gặp (FAQ)
                      </h3>
                      <p className="type-legal text-muted-foreground">
                        Hiển thị công khai dạng accordion + giúp AI (Google AI Overview, ChatGPT...)
                        trích dẫn trực tiếp nội dung này.
                      </p>
                    </div>
                    <FAQManager ownerType="service" ownerId={activeService.id} />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20 mt-auto">
              <Button
                variant="outline"
                type="button"
                onClick={() => setActiveService(null)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Đang lưu..."
                  : activeService === "new"
                    ? "Tạo dịch vụ"
                    : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </div>
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
