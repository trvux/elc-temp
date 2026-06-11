"use client";

import { ArrowSquareOut, Plus, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/components/ui/field";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { generateSlug } from "@/shared/lib/helpers";

import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import { getServiceGroupsAction } from "@/modules/service-group/presentation/actions";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { ProjectWithCategory } from "../../domain";
import { deleteProjectAction, getProjectsAction } from "../actions";
import { useProjectForm } from "../hooks/useProjectForm";
import { getColumns } from "./ProjectColumns";

export function ProjectManagement() {
  const queryClient = useQueryClient();
  const [activeProject, setActiveProject] = useState<
    ProjectWithCategory | "new" | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("all");
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterProjectTypeId, setFilterProjectTypeId] = useState<string>("all");
  const [filterServiceGroupId, setFilterServiceGroupId] =
    useState<string>("all");
  const [filterServiceId, setFilterServiceId] = useState<string>("all");

  const handleServiceGroupIdChange = (val: string) => {
    setFilterServiceGroupId(val);
    setFilterServiceId("all");
  };

  // Fetch Data
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await getProjectsAction({
        includeDeleted: false,
      });
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: projectTypes = [] } = useQuery({
    queryKey: ["project-types"],
    queryFn: async () => {
      const { data, error } = await getProjectTypesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await getGroupsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-new"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-admin"],
    queryFn: async () => {
      const { data, error } = await getServicesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: serviceGroups = [] } = useQuery({
    queryKey: ["service-groups-list"],
    queryFn: async () => {
      const { data, error } = await getServiceGroupsAction();
      if (error) throw new Error(error);
      return data || [];
    },
  });

  const filteredServicesForFilter = useMemo(() => {
    if (filterServiceGroupId === "all") {
      return services;
    }
    return services.filter((s) => s.groupId === filterServiceGroupId);
  }, [services, filterServiceGroupId]);

  // Group custom categories for checkbox display
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

  // Custom Form Hook
  const { form, saveMutation, handleContentChange, supabase } = useProjectForm(
    activeProject,
    () => setActiveProject(null),
  );

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProjectAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa dự án");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleGroupIdChange = (val: string) => {
    setFilterGroupId(val);
    setFilterCategoryId("all");
  };

  const filteredCategoriesForFilter = useMemo(() => {
    if (filterGroupId === "all") {
      return categories;
    }
    return categories.filter((c) => c.groupId === filterGroupId);
  }, [categories, filterGroupId]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchGroup =
        filterGroupId === "all" ||
        (p.categories && p.categories.some((c) => c.groupId === filterGroupId));

      const matchCategory =
        filterCategoryId === "all" ||
        (p.categories && p.categories.some((c) => c.id === filterCategoryId));

      const matchProjectType =
        filterProjectTypeId === "all" ||
        p.projectTypeId === filterProjectTypeId;

      const matchFeatured =
        filterIsFeatured === "all" ||
        (filterIsFeatured === "true" ? p.isFeatured : !p.isFeatured);

      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? p.isPublished : !p.isPublished);

      const matchServiceGroup =
        filterServiceGroupId === "all" ||
        (p.services || []).some((s) => s.group?.id === filterServiceGroupId);

      const matchService =
        filterServiceId === "all" ||
        (p.services || []).some((s) => s.id === filterServiceId);

      return (
        matchGroup &&
        matchCategory &&
        matchProjectType &&
        matchFeatured &&
        matchPublished &&
        matchServiceGroup &&
        matchService
      );
    });
  }, [
    projects,
    filterGroupId,
    filterCategoryId,
    filterProjectTypeId,
    filterIsFeatured,
    filterIsPublished,
    filterServiceGroupId,
    filterServiceId,
  ]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (p) => {
          setActiveProject(p);
          form.reset({
            title: p.title,
            slug: p.slug || "",
            description: p.description,
            categoryId: "00000000-0000-0000-0000-000000000000",
            projectTypeId: p.projectTypeId || "",
            serviceGroupId: p.services?.[0]?.group?.id || "",
            serviceIds: (p.services || []).map((s) => s.id),
            categories: (p.categories || []).map((c) => ({ id: c.id, condition: c.condition })),
            images: p.images || [],
            isPublished: p.isPublished,
            isFeatured: p.isFeatured || false,
            metaTitle: p.metaTitle || "",
            metaDescription: p.metaDescription || "",
            orderIndex: p.orderIndex,
          });
        },
        onDelete: setDeletingId,
      }),
    [form],
  );

  function openCreate() {
    setActiveProject("new");
    form.reset({
      title: "",
      slug: "",
      description: null,
      categoryId: "00000000-0000-0000-0000-000000000000",
      projectTypeId: "",
      serviceGroupId: "",
      serviceIds: [],
      categories: [],
      images: [],
      isPublished: true,
      isFeatured: false,
      metaTitle: "",
      metaDescription: "",
      orderIndex: 0,
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dự án</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý danh sách các dự án đã thực hiện.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm dự án
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Service Type Filter */}
        <Select
          value={filterProjectTypeId}
          onValueChange={setFilterProjectTypeId}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Loại hình công trình" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại hình</SelectItem>
            {projectTypes.map((st) => (
              <SelectItem key={st.id} value={st.id}>
                {st.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Group Filter */}
        <Select value={filterGroupId} onValueChange={handleGroupIdChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Nhóm danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhóm danh mục</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {filteredCategoriesForFilter.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Featured Filter (Mức độ) */}
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
          <SelectTrigger className="w-full md:w-[170px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hiển thị</SelectItem>
            <SelectItem value="false">Đang ẩn</SelectItem>
          </SelectContent>
        </Select>

        {/* Service Group Filter */}
        <Select
          value={filterServiceGroupId}
          onValueChange={handleServiceGroupIdChange}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Nhóm dịch vụ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhóm dịch vụ</SelectItem>
            {serviceGroups.map((sg) => (
              <SelectItem key={sg.id} value={sg.id}>
                {sg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Service Filter */}
        <Select value={filterServiceId} onValueChange={setFilterServiceId}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Dịch vụ thực hiện" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dịch vụ</SelectItem>
            {filteredServicesForFilter.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filterIsPublished !== "all" ||
          filterIsFeatured !== "all" ||
          filterGroupId !== "all" ||
          filterCategoryId !== "all" ||
          filterProjectTypeId !== "all" ||
          filterServiceGroupId !== "all" ||
          filterServiceId !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterIsPublished("all");
              setFilterIsFeatured("all");
              setFilterGroupId("all");
              setFilterCategoryId("all");
              setFilterProjectTypeId("all");
              setFilterServiceGroupId("all");
              setFilterServiceId("all");
            }}
            className="h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredProjects}
        isLoading={isProjectsLoading}
        searchKey="title"
        searchPlaceholder="Tìm kiếm tên dự án..."
      />

      <AdminDialog
        open={!!activeProject}
        onOpenChange={(open) => !open && setActiveProject(null)}
        size="full"
        title={activeProject === "new" ? "Thêm dự án" : "Sửa dự án"}
        description="Quản lý chi tiết dự án, hình ảnh và hiển thị."
      >
        <Tabs
          defaultValue="info"
          className="flex flex-col flex-1 min-h-0 relative w-full"
        >
          {/* Centered Sticky Header Tabs */}
          <div className="flex sticky top-0 z-20 w-full items-center justify-center border-b bg-background/95 py-4 backdrop-blur">
            <TabsList>
              <TabsTrigger value="info">Thông tin chung</TabsTrigger>
              <TabsTrigger value="type-categories">
                Loại hình & Sản phẩm
              </TabsTrigger>
              <TabsTrigger value="service">Dịch vụ liên quan</TabsTrigger>
              <TabsTrigger value="content">Nội dung dự án</TabsTrigger>
            </TabsList>
          </div>

          <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col min-h-0">
            <form
              onSubmit={form.handleSubmit(
                (v) => {
                  saveMutation.mutate(v);
                },
                (errs) => {
                  console.error("CLIENT-SIDE FORM VALIDATION ERRORS:", errs);
                  toast.error(
                    "Vui lòng kiểm tra các trường thông tin bắt buộc (Tiêu đề, Slug, Danh mục, v.v...)",
                  );
                },
              )}
              className="flex-1 flex flex-col min-h-0 w-full"
            >
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                {/* Tab 1: General Info */}
                <TabsContent
                  value="info"
                  className="mt-0 focus-visible:outline-none space-y-12 pb-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column (Details & Configuration) */}
                    <div className="lg:col-span-6 space-y-6">
                      <Controller
                        control={form.control}
                        name="title"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Tên dự án *</FieldLabel>
                            <Input
                              {...field}
                              placeholder="VD: Lắp máy lạnh nhà anh Tuấn"
                              onChange={(e) => {
                                field.onChange(e);
                                form.setValue(
                                  "slug",
                                  generateSlug(e.target.value),
                                );
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
                              placeholder="vd: lap-may-lanh-nha-anh-tuan"
                            />
                            <FieldDescription className="flex items-center gap-2">
                              <ArrowSquareOut size={12} />
                              /du-an/{field.value || "..."}
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
                              <FieldLabel className="font-normal mb-0">
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
                          name="isFeatured"
                          render={({ field }) => (
                            <Field
                              orientation="horizontal"
                              className="justify-between border p-3 rounded-xl"
                            >
                              <FieldLabel className="font-normal mb-0">
                                Nổi bật
                              </FieldLabel>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </Field>
                          )}
                        />
                      </div>

                      <Controller
                        control={form.control}
                        name="orderIndex"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>Thứ tự hiển thị</FieldLabel>
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

                    {/* Right Column (Images) */}
                    <div className="lg:col-span-6 space-y-6">
                      <Controller
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>
                              Upload ảnh ({field.value?.length || 0})
                            </FieldLabel>
                            <div className="space-y-4">
                              <ImageUpload
                                value=""
                                onChange={(url) => {
                                  if (url) {
                                    field.onChange([
                                      ...(field.value || []),
                                      url,
                                    ]);
                                  }
                                }}
                                aspectRatio={2.5}
                                folderPath="projects"
                              />

                              {field.value && field.value.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 mt-3">
                                  {field.value.map((url: string, i: number) => (
                                    <div
                                      key={i}
                                      className="relative aspect-square rounded-xl overflow-hidden group border bg-muted/20"
                                    >
                                      <Image
                                        src={url}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 100px"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                          size="icon"
                                          variant="destructive"
                                          type="button"
                                          className="h-7 w-7 rounded-full shadow-lg"
                                          onClick={() => {
                                            const next = [...field.value];
                                            next.splice(i, 1);
                                            field.onChange(next);
                                          }}
                                        >
                                          <X size={14} />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Field>
                        )}
                      />
                    </div>
                  </div>

                  {/* SEO Section */}
                  <div className="space-y-6 border p-6 rounded-2xl bg-muted/10">
                    <div className="border-b pb-2">
                      <h3 className="text-sm font-semibold tracking-tight">
                        Cấu hình SEO
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Tối ưu hóa hiển thị trên các công cụ tìm kiếm (Google,
                        Bing,...).
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Controller
                        control={form.control}
                        name="metaTitle"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Tiêu đề SEO</FieldLabel>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="Để trống sẽ tự động dùng tiêu đề..."
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
                            <FieldLabel>Mô tả SEO</FieldLabel>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="Mô tả tóm tắt nội dung để hiển thị trên Google..."
                              className="min-h-[80px]"
                            />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Loại hình & Sản phẩm */}
                <TabsContent
                  value="type-categories"
                  className="mt-0 focus-visible:outline-none space-y-6 pb-8"
                >
                  <div className="space-y-6">
                    <Controller
                      control={form.control}
                      name="projectTypeId"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Loại hình công trình</FieldLabel>
                          <Select
                            value={field.value || "none"}
                            onValueChange={(v) => {
                              const val = v === "none" ? "" : v;
                              field.onChange(val);

                              // Only pre-populate if it is a new project or the user explicitly changed the project type (making the field dirty)
                              const shouldPrepopulate =
                                activeProject === "new" ||
                                !!form.formState.dirtyFields.projectTypeId;

                              if (shouldPrepopulate) {
                                if (val) {
                                  const sType = projectTypes.find(
                                    (s) => s.id === val,
                                  );
                                  if (sType && sType.categories) {
                                    const templateSelections = sType.categories.map(
                                      (c) => ({ id: c.id, condition: "new" as const }),
                                    );
                                    form.setValue("categories", templateSelections);
                                  }
                                } else {
                                  form.setValue("categories", []);
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại hình (nếu có)" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="max-h-60"
                            >
                              <ScrollArea className="h-full">
                                <SelectItem value="none">
                                  Không chọn loại hình
                                </SelectItem>
                                {projectTypes.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />

                    {/* Dòng sản phẩm thực tế selection */}
                    {form.watch("projectTypeId") && (
                      <Card>
                        <CardHeader className="pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="space-y-1">
                              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                                Dòng sản phẩm thực tế
                              </CardTitle>
                              <CardDescription className="text-xs text-muted-foreground">
                                Tích chọn các dòng sản phẩm lắp đặt thực tế cho dự
                                án này (Tự động điền theo loại hình công trình ở
                                trên, bạn có thể tự chỉnh thêm).
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs px-3 hover:bg-muted"
                                onClick={() => {
                                  const allSelections = categories.map((c) => ({
                                    id: c.id,
                                    condition: "new" as const,
                                  }));
                                  form.setValue("categories", allSelections);
                                }}
                              >
                                Chọn tất cả
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => {
                                  form.setValue("categories", []);
                                }}
                              >
                                Bỏ chọn tất cả
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Controller
                            control={form.control}
                            name="categories"
                            render={({ field }) => {
                              const checkedSelections = field.value || [];
                              const handleToggleCondition = (
                                catId: string,
                                condition: "new" | "used",
                                checked: boolean,
                              ) => {
                                if (checked) {
                                  field.onChange([
                                    ...checkedSelections,
                                    { id: catId, condition },
                                  ]);
                                } else {
                                  field.onChange(
                                    checkedSelections.filter(
                                      (x) =>
                                        !(
                                          x.id === catId &&
                                          x.condition === condition
                                        ),
                                    ),
                                  );
                                }
                              };

                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                  {Object.entries(groupedCategories).map(
                                    ([groupName, items]) => (
                                      <Card key={groupName}>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                          <span className="font-semibold text-md text-primary w-fit">
                                            {groupName}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                              onClick={() => {
                                                const groupItemIds = items.map(
                                                  (cat) => cat.id,
                                                );
                                                const otherSelections =
                                                  checkedSelections.filter(
                                                    (sel) =>
                                                      !groupItemIds.includes(
                                                        sel.id,
                                                      ),
                                                  );
                                                const groupNewSelections =
                                                  items.map((cat) => ({
                                                    id: cat.id,
                                                    condition: "new" as const,
                                                  }));
                                                field.onChange([
                                                  ...otherSelections,
                                                  ...groupNewSelections,
                                                ]);
                                              }}
                                            >
                                              Chọn tất cả
                                            </button>
                                            <span className="text-sm text-muted-foreground/30">
                                              |
                                            </span>
                                            <button
                                              type="button"
                                              className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                              onClick={() => {
                                                const groupItemIds = items.map(
                                                  (cat) => cat.id,
                                                );
                                                const otherSelections =
                                                  checkedSelections.filter(
                                                    (sel) =>
                                                      !groupItemIds.includes(
                                                        sel.id,
                                                      ),
                                                  );
                                                field.onChange(otherSelections);
                                              }}
                                            >
                                              Bỏ chọn
                                            </button>
                                          </div>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 gap-3">
                                          {items.map((cat) => {
                                            const isNewChecked =
                                              checkedSelections.some(
                                                (x) =>
                                                  x.id === cat.id &&
                                                  x.condition === "new",
                                              );
                                            const isUsedChecked =
                                              checkedSelections.some(
                                                (x) =>
                                                  x.id === cat.id &&
                                                  x.condition === "used",
                                              );
                                            return (
                                              <div
                                                key={cat.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border bg-muted/10 hover:bg-muted/30 transition-colors"
                                              >
                                                <span className="text-xs font-semibold text-foreground/85 select-none">
                                                  {cat.name}
                                                </span>
                                                <div className="flex items-center gap-4 shrink-0">
                                                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer select-none">
                                                    <input
                                                      type="checkbox"
                                                      className="h-4 w-4 border-input text-primary cursor-pointer accent-primary shrink-0"
                                                      checked={isNewChecked}
                                                      onChange={(e) =>
                                                        handleToggleCondition(
                                                          cat.id,
                                                          "new",
                                                          e.target.checked,
                                                        )
                                                      }
                                                    />
                                                    <span>Mới</span>
                                                  </label>
                                                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer select-none">
                                                    <input
                                                      type="checkbox"
                                                      className="h-4 w-4 border-input text-primary cursor-pointer accent-primary shrink-0"
                                                      checked={isUsedChecked}
                                                      onChange={(e) =>
                                                        handleToggleCondition(
                                                          cat.id,
                                                          "used",
                                                          e.target.checked,
                                                        )
                                                      }
                                                    />
                                                    <span>Cũ</span>
                                                  </label>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </CardContent>
                                      </Card>
                                    ),
                                  )}
                                </div>
                              );
                            }}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Tab 3: Dịch vụ liên quan */}
                <TabsContent
                  value="service"
                  className="mt-0 focus-visible:outline-none space-y-6 pb-8"
                >
                  <div className="space-y-6">
                    <Controller
                      control={form.control}
                      name="serviceGroupId"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Nhóm dịch vụ</FieldLabel>
                          <Select
                            value={field.value || "none"}
                            onValueChange={(v) => {
                              const val = v === "none" ? "" : v;
                              field.onChange(val);

                              // Only pre-populate/reset if it is a new project or the user explicitly changed the service group (making the field dirty)
                              const shouldPrepopulate =
                                activeProject === "new" ||
                                !!form.formState.dirtyFields.serviceGroupId;

                              if (shouldPrepopulate) {
                                // Reset serviceIds selection when group changes
                                form.setValue("serviceIds", []);

                                // Pre-populate categories based on selected serviceGroup!
                                if (val) {
                                  const sGroup = serviceGroups.find(
                                    (g) => g.id === val,
                                  );
                                  if (sGroup && sGroup.categoryIds) {
                                    const selections = sGroup.categoryIds.map(
                                      (id) => ({ id, condition: "new" as const }),
                                    );
                                    form.setValue("categories", selections);
                                  }
                                } else {
                                  form.setValue("categories", []);
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nhóm dịch vụ (nếu có)" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="max-h-60"
                            >
                              <ScrollArea className="h-full">
                                <SelectItem value="none">
                                  Không chọn nhóm dịch vụ
                                </SelectItem>
                                {serviceGroups.map((g) => (
                                  <SelectItem key={g.id} value={g.id}>
                                    {g.name}
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="serviceIds"
                      render={({ field }) => {
                        const selectedGroupId = form.watch("serviceGroupId");
                        const filteredServices =
                          selectedGroupId && selectedGroupId !== "none"
                            ? services.filter(
                                (s) => s.groupId === selectedGroupId,
                              )
                            : services;
                        const checkedIds = field.value || [];
                        const handleToggle = (id: string, checked: boolean) => {
                          if (checked) {
                            field.onChange([...checkedIds, id]);
                          } else {
                            field.onChange(checkedIds.filter((x) => x !== id));
                          }
                        };

                        return (
                          <Card>
                            <CardHeader className="pb-4">
                              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                                Dịch vụ thực hiện
                              </CardTitle>
                              <CardDescription className="text-xs text-muted-foreground">
                                Tích chọn các dịch vụ liên quan đến dự án này.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              {!selectedGroupId ||
                              selectedGroupId === "none" ? (
                                <div className="text-sm text-muted-foreground italic py-4 text-center bg-muted/30 rounded-md mt-2 border border-dashed">
                                  Vui lòng chọn Nhóm dịch vụ phía trên để hiển
                                  thị danh sách dịch vụ thực hiện.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                  {filteredServices.map((s) => {
                                    const isChecked = checkedIds.includes(s.id);
                                    return (
                                      <label
                                        key={s.id}
                                        className="flex items-center gap-3 text-xs font-medium text-foreground/80 cursor-pointer hover:text-primary transition-colors select-none hover:bg-muted/30"
                                      >
                                        <input
                                          type="checkbox"
                                          className="h-4.5 w-4.5 border-input text-primary cursor-pointer accent-primary shrink-0"
                                          checked={isChecked}
                                          onChange={(e) =>
                                            handleToggle(s.id, e.target.checked)
                                          }
                                        />
                                        <span className="leading-tight">
                                          {s.title}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      }}
                    />
                  </div>
                </TabsContent>

                {/* Tab 2: Editor Section */}
                <TabsContent
                  value="content"
                  className="mt-0 focus-visible:outline-none space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-sm font-semibold tracking-tight">
                        Nội dung chi tiết dự án
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
                          key={
                            activeProject === "new" ? "new" : activeProject?.id
                          }
                          value={field.value}
                          onChange={handleContentChange}
                          placeholder="Viết nội dung chi tiết dự án ở đây..."
                          uploadImage={async (file) => {
                            const fileName = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
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
                </TabsContent>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setActiveProject(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? "Đang lưu..."
                    : activeProject === "new"
                      ? "Tạo dự án"
                      : "Lưu thay đổi"}
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
