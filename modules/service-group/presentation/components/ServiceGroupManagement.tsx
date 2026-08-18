"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ServiceGroup, CreateServiceGroupInput, UpdateServiceGroupInput } from "../../domain/types";
import { getServiceGroupColumns } from "./ServiceGroupColumns";
import { useServiceGroupForm } from "../hooks/useServiceGroupForm";
import { capitalize } from "@/shared/lib/helpers";
import { cn } from "@/shared/lib/utils";
import {
  createServiceGroupAction,
  updateServiceGroupAction,
  deleteServiceGroupAction,
} from "../actions";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { DataTable } from "@/shared/components/ui/data-table";
import { DeleteDialog } from "@/shared/components/organisms/layout/admin/delete-dialog";
import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { Controller } from "react-hook-form";
import { Field, FieldError, FieldLabel, FieldGroup, FieldSet, FieldLegend, FieldSeparator } from "@/shared/components/ui/field";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import { Plus, CaretDown } from "@phosphor-icons/react";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface ServiceGroupManagementProps {
  initialData: ServiceGroup[];
}

export function ServiceGroupManagement({ initialData }: ServiceGroupManagementProps) {
  const [activeGroup, setActiveGroup] = useState<ServiceGroup | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { form } = useServiceGroupForm(
    activeGroup === "new" ? null : activeGroup
  );

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-new"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Filters
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");

  const filteredGroups = useMemo(() => {
    return initialData.filter((g) => {
      const matchFeatured =
        filterIsFeatured === "all" ||
        (filterIsFeatured === "true" ? g.isFeatured : !g.isFeatured);

      const matchCategory =
        filterCategoryId === "all" ||
        (g.categoryIds && g.categoryIds.includes(filterCategoryId));

      return matchFeatured && matchCategory;
    });
  }, [initialData, filterIsFeatured, filterCategoryId]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const groupedCategories = useMemo(() => {
    const grouped: Record<string, typeof categories> = {};
    categories.forEach((cat) => {
      const groupName = cat.group?.name || "Khác";
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(cat);
    });
    return grouped;
  }, [categories]);

  const selectedCategoryIds = form.watch("categoryIds") || [];

  const handleToggleCategory = (catId: string) => {
    const current = [...selectedCategoryIds];
    const idx = current.indexOf(catId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(catId);
    }
    form.setValue("categoryIds", current, { shouldDirty: true, shouldValidate: true });
  };

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (data: CreateServiceGroupInput | UpdateServiceGroupInput) => {
      if (activeGroup === "new") {
        return createServiceGroupAction(data as CreateServiceGroupInput);
      }
      return updateServiceGroupAction(data as UpdateServiceGroupInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeGroup === "new" ? "Tạo nhóm dịch vụ thành công" : "Cập nhật thành công"
      );
      setActiveGroup(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["admin-service-groups"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteServiceGroupAction(id);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Xoá thành công");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-service-groups"] });
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    if (activeGroup !== "new" && !activeGroup?.id) return;

    const formData = {
      ...values,
      ...(activeGroup !== "new" ? { id: activeGroup?.id } : {}),
    };

    saveMutation.mutate(formData);
  });

  const columns = useMemo(() => getServiceGroupColumns({
    categories,
    onEdit: (group) => setActiveGroup(group),
    onDelete: (id) => setDeletingId(id),
  }), [categories]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nhóm dịch vụ</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Quản lý các nhóm dịch vụ (vd: Cơ Điện Lạnh, Điện Máy, Xây Dựng...)
          </p>
        </div>
        <Button onClick={() => setActiveGroup("new")}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhóm mới
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Dòng sản phẩm liên kết" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dòng sản phẩm</SelectItem>
            {categories.map((c) => (
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

        {(filterIsFeatured !== "all" || filterCategoryId !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterIsFeatured("all");
              setFilterCategoryId("all");
            }}
            className="h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredGroups}
        searchKey="name"
        searchPlaceholder="Tìm theo tên nhóm..."
      />

      <AdminDialog
        open={activeGroup !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveGroup(null);
            form.reset();
          }
        }}
        title={activeGroup === "new" ? "Thêm Nhóm dịch vụ" : "Sửa Nhóm dịch vụ"}
        description="Quản lý chi tiết nhóm dịch vụ, ảnh đại diện và SEO."
        size="full"
      >
        <form
          onSubmit={onSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: General Info */}
                <FieldGroup className="lg:col-span-8 gap-8">
                  <FieldSet>
                    <FieldLegend>Thông tin nhóm dịch vụ</FieldLegend>
                    <FieldGroup className="space-y-5">
                      <Controller
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Tên nhóm dịch vụ *</FieldLabel>
                            <Input
                              {...field}
                              onChange={(e) => field.onChange(capitalize(e.target.value))}
                              placeholder="vd: Điện lạnh dân dụng"
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
                            <Input {...field} placeholder="Tự động tạo nếu để trống" />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </FieldSet>

                  <FieldSet>
                    <FieldLegend>Dòng sản phẩm liên kết (Nhóm danh mục → Danh mục chi tiết)</FieldLegend>
                    <div className="space-y-4 mt-2">
                      {Object.keys(groupedCategories).length === 0 ? (
                        <span className="text-sm text-muted-foreground italic block">
                          Chưa có danh mục sản phẩm nào, vui lòng tạo danh mục trước.
                        </span>
                      ) : (
                        Object.entries(groupedCategories).map(([groupName, groupCats]) => {
                          const isExpanded = !!expandedGroups[groupName];
                          const selectedInGroupCount = groupCats.filter((c) =>
                            selectedCategoryIds.includes(c.id)
                          ).length;

                          return (
                            <div key={groupName} className="border rounded-xl p-4 bg-muted/5 space-y-3">
                              <button
                                type="button"
                                onClick={() => toggleGroup(groupName)}
                                className="flex items-center justify-between w-full font-semibold text-xs text-foreground bg-muted/80 border border-border px-2.5 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors"
                              >
                                <span>
                                  {groupName} ({selectedInGroupCount}/{groupCats.length})
                                </span>
                                <CaretDown
                                  className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                                />
                              </button>
                              {isExpanded && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pl-1 pt-1">
                                  {groupCats.map((cat) => (
                                    <label
                                      key={cat.id}
                                      className="flex items-center gap-3 text-sm font-medium text-foreground/80 cursor-pointer hover:text-primary transition-colors select-none p-3 border rounded-xl bg-background hover:bg-muted/30"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedCategoryIds.includes(cat.id)}
                                        onChange={() => handleToggleCategory(cat.id)}
                                        className="h-4.5 w-4.5 rounded-md border-input text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                                      />
                                      <span className="leading-tight">{cat.name}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </FieldSet>
                </FieldGroup>

                {/* Right Column: Image Upload & Display Config */}
                <FieldGroup className="lg:col-span-4 gap-8">
                  <FieldSet className="w-full">
                    <FieldLegend>Hình ảnh đại diện</FieldLegend>
                    <Controller
                      control={form.control}
                      name="imageUrl"
                      render={({ field, fieldState }) => (
                        <Field className="w-full">
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            aspectRatio="16:9"
                            folderPath="service-groups"
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
                          name="orderIndex"
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Thứ tự hiển thị</FieldLabel>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="isFeatured"
                          render={({ field, fieldState }) => (
                            <Field orientation="horizontal" className="justify-between items-center border px-3 py-2 rounded-xl self-end h-[42px] gap-2">
                              <FieldLabel className="font-normal text-xs whitespace-nowrap mb-0">Nổi bật</FieldLabel>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />
                      </div>
                    </FieldGroup>
                  </FieldSet>
                </FieldGroup>
              </div>

              {/* SEO Section */}
              <div className="space-y-6 border p-6 rounded-2xl bg-muted/10">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-semibold tracking-tight">Cấu hình SEO</h3>
                  <p className="text-[11px] text-muted-foreground">Tối ưu hóa hiển thị trên các công cụ tìm kiếm.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    control={form.control}
                    name="metaTitle"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel className="text-xs">Tiêu đề SEO</FieldLabel>
                        <Input {...field} value={field.value || ""} placeholder="Để trống sẽ tự động dùng tên nhóm..." />
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
                        <Textarea {...field} value={field.value || ""} placeholder="Nhập mô tả SEO..." className="min-h-[80px]" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
            <Button
              variant="outline"
              type="button"
              onClick={() => setActiveGroup(null)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Đang lưu..."
                : activeGroup === "new"
                  ? "Tạo nhóm dịch vụ"
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
        entityType="service-group"
        entityId={deletingId}
      />
    </div>
  );
}
