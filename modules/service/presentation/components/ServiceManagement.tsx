"use client";

import { CategoryWithGroup } from "@/modules/category/domain/types";
import { ServiceGroup } from "@/modules/service-group/domain/types";
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
import { useServiceForm } from "../hooks/useServiceForm";
import { getServiceColumns } from "./ServiceColumns";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
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
import { createClient } from "@/shared/lib/supabase/client";

interface ServiceManagementProps {
  initialData: ServiceWithRelations[];
  groups: ServiceGroup[];
  categories: CategoryWithGroup[];
}

export function ServiceManagement({
  initialData,
  groups,
  categories,
}: ServiceManagementProps) {
  const supabase = createClient();
  const [activeService, setActiveService] = useState<
    ServiceWithRelations | "new" | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Filters
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("all");
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  const handleGroupIdChange = (val: string) => {
    setFilterGroupId(val);
    setFilterCategoryId("all");
  };

  const filteredCategoriesForFilter = useMemo(() => {
    if (filterGroupId === "all") {
      return categories;
    }
    const selectedGroup = groups.find((g) => g.id === filterGroupId);
    if (!selectedGroup || !selectedGroup.categoryIds) return [];
    return categories.filter((c) => selectedGroup.categoryIds?.includes(c.id));
  }, [categories, groups, filterGroupId]);

  const filteredServices = useMemo(() => {
    return initialData.filter((s) => {
      const matchGroup =
        filterGroupId === "all" || s.groupId === filterGroupId;

      const matchCategory =
        filterCategoryId === "all" || s.categoryId === filterCategoryId;

      const matchFeatured =
        filterIsFeatured === "all" ||
        (filterIsFeatured === "true" ? s.isFeatured : !s.isFeatured);

      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? s.isPublished : !s.isPublished);

      return matchGroup && matchCategory && matchFeatured && matchPublished;
    });
  }, [initialData, filterGroupId, filterCategoryId, filterIsFeatured, filterIsPublished]);

  const {
    form,
    getFormData,
    labelInput,
    setLabelInput,
    addLabel,
    removeLabel,
  } = useServiceForm(activeService === "new" ? null : activeService);

  const watchGroupId = form.watch("groupId");

  const filteredCategories = useMemo(() => {
    if (!watchGroupId || watchGroupId === "none") return [];
    const selectedGroup = groups.find((g) => g.id === watchGroupId);
    if (!selectedGroup || !selectedGroup.categoryIds) return [];

    return categories.filter((c) => selectedGroup.categoryIds?.includes(c.id));
  }, [watchGroupId, groups, categories]);

  useEffect(() => {
    const currentCatId = form.getValues("categoryId");
    if (currentCatId && currentCatId !== "none") {
      const isStillValid = filteredCategories.some(
        (c) => c.id === currentCatId,
      );
      if (!isStillValid) {
        form.setValue("categoryId", null);
      }
    }
  }, [filteredCategories, form]);

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (data: CreateServiceInput | UpdateServiceInput) => {
      if (activeService === "new") {
        return createServiceAction(data as CreateServiceInput);
      }
      return updateServiceAction(data as UpdateServiceInput);
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

  const watchPriceMode = form.watch("priceMode");
  const watchOriginalPrice = form.watch("originalPrice");
  const watchDiscountPercent = form.watch("discountPercent");

  // Calculate preview sale price
  const previewSalePrice =
    watchOriginalPrice && watchDiscountPercent
      ? watchOriginalPrice -
        Math.round(watchOriginalPrice * (watchDiscountPercent / 100))
      : watchOriginalPrice;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dịch vụ</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Quản lý danh sách các gói dịch vụ, giá bán và nhãn dán hiển thị
          </p>
        </div>
        <Button onClick={() => setActiveService("new")}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm dịch vụ mới
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Service Group Filter */}
        <Select value={filterGroupId} onValueChange={handleGroupIdChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Nhóm dịch vụ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhóm</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Dòng sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dòng sản phẩm</SelectItem>
            {filteredCategoriesForFilter.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Featured Filter */}
        <Select value={filterIsFeatured} onValueChange={setFilterIsFeatured}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Mức độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mức độ</SelectItem>
            <SelectItem value="true">Nổi bật</SelectItem>
            <SelectItem value="false">Thường</SelectItem>
          </SelectContent>
        </Select>

        {/* Published Filter */}
        <Select value={filterIsPublished} onValueChange={setFilterIsPublished}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hiển thị</SelectItem>
            <SelectItem value="false">Đang ẩn</SelectItem>
          </SelectContent>
        </Select>

        {(filterGroupId !== "all" ||
          filterCategoryId !== "all" ||
          filterIsFeatured !== "all" ||
          filterIsPublished !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterGroupId("all");
              setFilterCategoryId("all");
              setFilterIsFeatured("all");
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
                              <FieldLabel>Tên dịch vụ *</FieldLabel>
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

                        <div className="grid grid-cols-2 gap-4">
                          <Controller
                            control={form.control}
                            name="groupId"
                            render={({ field, fieldState }) => (
                              <Field>
                                <FieldLabel>Nhóm dịch vụ</FieldLabel>
                                <Select
                                  value={field.value || "none"}
                                  onValueChange={(v) =>
                                    field.onChange(v === "none" ? null : v)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn nhóm" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      Không thuộc nhóm nào
                                    </SelectItem>
                                    {groups.map((g) => (
                                      <SelectItem key={g.id} value={g.id}>
                                        {g.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FieldError errors={[fieldState.error]} />
                              </Field>
                            )}
                          />

                          <Controller
                            control={form.control}
                            name="categoryId"
                            render={({ field, fieldState }) => (
                              <Field>
                                <FieldLabel>Danh mục liên kết</FieldLabel>
                                <Select
                                  value={field.value || "none"}
                                  disabled={
                                    !watchGroupId || watchGroupId === "none"
                                  }
                                  onValueChange={(v) =>
                                    field.onChange(v === "none" ? null : v)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        watchGroupId && watchGroupId !== "none"
                                          ? "Chọn danh mục"
                                          : "Vui lòng chọn nhóm trước"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      Không thuộc danh mục nào
                                    </SelectItem>
                                    {filteredCategories.map((c) => (
                                      <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FieldError errors={[fieldState.error]} />
                              </Field>
                            )}
                          />
                        </div>

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

                    {/* Pricing Block */}
                    <FieldSet>
                      <FieldLegend>Cấu hình giá / Hiển thị</FieldLegend>
                      <div className="border rounded-xl p-5 bg-muted/5 space-y-5">
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground">
                            Chọn hiển thị dạng Giá tiền thực tế hoặc Văn bản tuỳ
                            chỉnh (vd: Liên hệ).
                          </p>
                        </div>

                        <Controller
                          control={form.control}
                          name="priceMode"
                          render={({ field }) => (
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="price" id="mode-price" />
                                <label
                                  htmlFor="mode-price"
                                  className="text-sm cursor-pointer"
                                >
                                  Giá tiền
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="text" id="mode-text" />
                                <label
                                  htmlFor="mode-text"
                                  className="text-sm cursor-pointer"
                                >
                                  Văn bản tuỳ chỉnh
                                </label>
                              </div>
                            </RadioGroup>
                          )}
                        />

                        <div className="pt-2">
                          {watchPriceMode === "price" ? (
                            <div className="grid grid-cols-2 gap-4">
                              <Controller
                                control={form.control}
                                name="originalPrice"
                                render={({ field, fieldState }) => (
                                  <Field>
                                    <FieldLabel>Giá gốc (VNĐ)</FieldLabel>
                                    <Input
                                      type="number"
                                      value={field.value || ""}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                        )
                                      }
                                      placeholder="vd: 5000000"
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                  </Field>
                                )}
                              />
                              <Controller
                                control={form.control}
                                name="discountPercent"
                                render={({ field, fieldState }) => (
                                  <Field>
                                    <FieldLabel>Phần trăm giảm (%)</FieldLabel>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={field.value || ""}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                        )
                                      }
                                      placeholder="vd: 15"
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                  </Field>
                                )}
                              />

                              <div className="col-span-2 mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20 flex justify-between items-center">
                                <span className="text-sm text-primary font-medium">
                                  Giá bán tự động tính:
                                </span>
                                <span className="text-base font-bold text-red-600">
                                  {previewSalePrice
                                    ? new Intl.NumberFormat("vi-VN", {
                                        style: "currency",
                                        currency: "VND",
                                      }).format(previewSalePrice)
                                    : "Chưa thiết lập"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <Controller
                              control={form.control}
                              name="priceDisplayText"
                              render={({ field, fieldState }) => (
                                <Field>
                                  <FieldLabel>Văn bản hiển thị</FieldLabel>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="vd: Liên hệ, Theo khảo sát thực tế..."
                                  />
                                  <FieldError errors={[fieldState.error]} />
                                </Field>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </FieldSet>
                  </FieldGroup>

                  {/* Right Column: Image Upload, Display Config, Badges */}
                  <FieldGroup className="lg:col-span-4 gap-8">
                    <FieldSet className="w-full">
                      <FieldLegend>Hình ảnh đại diện</FieldLegend>
                      <Controller
                        control={form.control}
                        name="image"
                        render={({ field, fieldState }) => (
                          <Field className="w-full">
                            <ImageUpload
                              value={field.value || ""}
                              onChange={field.onChange}
                              aspectRatio={4 / 3}
                              folderPath="services"
                            />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
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
                                    <FieldLabel className="text-sm font-semibold tracking-tight">
                                      Hiển thị
                                    </FieldLabel>
                                    <span className="text-[10px] text-muted-foreground block">
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
                          <Controller
                            control={form.control}
                            name="isFeatured"
                            render={({ field, fieldState }) => (
                              <Field>
                                <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/10 h-full">
                                  <div className="space-y-0.5">
                                    <FieldLabel className="text-sm font-semibold tracking-tight">
                                      Nổi bật
                                    </FieldLabel>
                                    <span className="text-[10px] text-muted-foreground block">
                                      Lên đầu
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
                          <p className="text-[11px] text-muted-foreground">
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
                            <span className="text-xs text-muted-foreground italic">
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
                    <h3 className="text-sm font-semibold tracking-tight">
                      Cấu hình SEO
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Tối ưu hóa hiển thị trên các công cụ tìm kiếm.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Controller
                      control={form.control}
                      name="metaTitle"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel className="text-xs">
                            Tiêu đề SEO
                          </FieldLabel>
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
                          <FieldLabel className="text-xs">Mô tả SEO</FieldLabel>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Mô tả tóm tắt dịch vụ để hiển thị trên Google..."
                            className="min-h-[80px]"
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </div>
                </div>

                {/* Editor Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-semibold tracking-tight">Nội dung chi tiết dịch vụ</h3>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tiptap</span>
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
                        uploadImage={async (file: File) => {
                          const fileName = `services/${Date.now()}-${Math.random()
                            .toString(36)
                            .slice(2)}.webp`;
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
