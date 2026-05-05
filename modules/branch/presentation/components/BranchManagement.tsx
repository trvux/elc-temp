"use client";

import { useState, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { DataTable } from "@/shared/components/ui/data-table";
import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { capitalize, extractTitleFromHtml, generateSlug } from "@/shared/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { z } from "zod";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { 
  getBranchesAction, 
  createBranchAction, 
  updateBranchAction, 
  deleteBranchAction,
} from "../actions";
import { getBranchColumns } from "./BranchColumns";
import { Branch, createBranchSchema, Json, UpdateBranchInput, CreateBranchInput } from "../../domain";

type BranchFormValues = z.infer<typeof createBranchSchema>;

export function BranchManagement() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<BranchFormValues>({
    resolver: standardSchemaResolver(createBranchSchema),
    defaultValues: {
      name: "",
      slug: "",
      address: "",
      phone: "",
      email: "",
      mapsUrl: "",
      mapsEmbed: "",
      description: "",
      isPublished: true,
      orderIndex: 0,
    },
  });

  // Fetch branches with React Query
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await getBranchesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Create/Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (values: BranchFormValues) => {
      if (editing) {
        return updateBranchAction({ 
          ...values, 
          id: editing.id,
          description: values.description as Json
        } as UpdateBranchInput);
      }
      return createBranchAction({
        ...values,
        description: values.description as Json
      } as CreateBranchInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editing ? "Đã cập nhật chi nhánh" : "Đã tạo chi nhánh");
      setOpen(false);
      queryClient.invalidateQueries(["branches"]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Đã có lỗi xảy ra");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteBranchAction(id);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa");
      setDeleteOpen(false);
      queryClient.invalidateQueries(["branches"]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Đã có lỗi xảy ra");
    },
  });

  const columns = useMemo(
    () =>
      getBranchColumns({
        onEdit: (b) => openEdit(b),
        onDelete: openDelete,
      }),
    [branches],
  );

  function openCreate() {
    setEditing(null);
    form.reset({
      name: "",
      slug: "",
      address: "",
      phone: "",
      email: "",
      mapsUrl: "",
      mapsEmbed: "",
      description: "",
      isPublished: true,
      orderIndex: 0,
    });
    setOpen(true);
  }

  function openEdit(b: Branch) {
    setEditing(b);
    
    let description = (b.description as string) || "";
    if (typeof description === "string" && !description.includes("<h1") && b.name) {
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
      isPublished: b.isPublished,
      orderIndex: b.orderIndex,
    });
    setOpen(true);
  }

  const onSave = (values: BranchFormValues) => {
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chi nhánh</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý địa điểm chi nhánh.
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
        searchPlaceholder="Tìm kiếm tên, slug, địa chỉ..."
      />

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        size="full"
        title={editing ? "Sửa chi nhánh" : "Thêm chi nhánh"}
        description="Điền thông tin chi nhánh để hiển thị trên website."
      >
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-6">
              <Field className="col-span-2">
                <FieldLabel className="mb-2 font-medium">
                  Tên chi nhánh *
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          placeholder="Văn phòng Quận 1"
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (!form.getValues("slug")) {
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

              <Field className="col-span-2">
                <FieldLabel className="mb-2 font-medium">
                  Đường dẫn (URL) *
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="slug"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          placeholder="van-phong-quan-1"
                          onChange={(e) => field.onChange(e.target.value.replace(/-+/g, "-").replace(/^-+|-+$/g, ""))}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </>
                    )}
                  />
                  <FieldDescription className="text-xs italic">
                    URL: /chi-nhanh/{form.watch("slug") || "slug"}
                  </FieldDescription>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium">
                Mô tả chi nhánh
              </FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value as string}
                      onChange={(val) => {
                        field.onChange(val);
                        const extractedTitle = extractTitleFromHtml(val);
                        if (!form.getValues("name")) {
                          form.setValue("name", extractedTitle);
                        }
                        if (!form.getValues("slug")) {
                          form.setValue("slug", generateSlug(extractedTitle));
                        }
                      }}
                      placeholder="Viết nội dung chi nhánh..."
                    />
                  )}
                />
              </FieldContent>
            </Field>

            <div className="grid grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2 font-medium">
                  Số điện thoại
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="0909 123 456"
                      />
                    )}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="mb-2 font-medium">Email</FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          placeholder="contact@company.com"
                        />
                        <FieldError errors={[fieldState.error]} />
                      </>
                    )}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium">Địa chỉ</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Địa chỉ chi nhánh..."
                      onChange={(e) => field.onChange(capitalize(e.target.value))}
                    />
                  )}
                />
              </FieldContent>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <Field>
                <FieldLabel className="mb-2 font-medium">
                  Link Google Maps
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="mapsUrl"
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="https://maps.google.com/..."
                      />
                    )}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="mb-2 font-medium text-xs text-muted-foreground capitalize tracking-widest">
                  Google Maps Embed (URL/iframe)
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="mapsEmbed"
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Paste iframe hoặc URL src..."
                        onChange={(e) => {
                          const val = e.target.value;
                          const match = val.match(/src="([^"]+)"/);
                          field.onChange(match ? match[1] : val);
                        }}
                        rows={2}
                      />
                    )}
                  />
                </FieldContent>
              </Field>
            </div>

            <div className="flex items-center justify-between border-t pt-6 pb-4">
              <div className="flex items-center gap-8">
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
                  <FieldLabel className="w-auto mb-0 font-medium h-full">
                    Thứ tự
                  </FieldLabel>
                  <FieldContent className="flex items-center min-h-0">
                    <Controller
                      control={form.control}
                      name="orderIndex"
                      render={({ field }) => (
                        <Input
                          type="number"
                          className="w-20"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </FieldContent>
                </Field>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? "Đang xử lý..." : (editing ? "Cập nhật" : "Tạo mới")}
                </Button>
              </div>
            </div>
          </FieldGroup>
        </form>
      </AdminDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}
