"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
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

import { Page, createPageSchema, updatePageSchema } from "../../domain";
import {
  createPageAction,
  deletePageAction,
  getPagesAction,
  updatePageAction,
} from "../actions";
import { getPageColumns } from "./PageColumns";

type PageFormValues = {
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
};

export function PageManagement() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  const form = useForm<PageFormValues>({
    resolver: standardSchemaResolver(createPageSchema as any) as any,
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      isPublished: true,
    },
  });

  // Fetch Data
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const { data, error } = await getPagesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values: PageFormValues) => {
      if (editing) {
        return updatePageAction({
          ...values,
          id: editing.id,
        } as any);
      }
      return createPageAction(values as any);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editing ? "Đã cập nhật trang" : "Đã tạo trang");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePageAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa trang");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });

  async function handleDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId);
  }

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? p.isPublished : !p.isPublished);
      return matchPublished;
    });
  }, [pages, filterIsPublished]);

  const columns = useMemo(
    () =>
      getPageColumns({
        onEdit: (p) => openEdit(p),
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
      content: "",
      isPublished: true,
    });
    setOpen(true);
  }

  function openEdit(p: Page) {
    setEditing(p);
    form.reset({
      title: p.title,
      slug: p.slug,
      content: p.content as any,
      isPublished: p.isPublished,
    });
    setOpen(true);
  }

  const supabase = createClient();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Trang nội dung</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các trang thông tin tĩnh của website.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm trang mới
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
        data={filteredPages}
        isLoading={isLoading}
        searchKey="title"
        searchPlaceholder="Tìm kiếm tên trang..."
      />

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        size="full"
        title={editing ? `Sửa: ${editing.title}` : "Thêm trang mới"}
        description="Cấu hình nội dung chi tiết cho trang tĩnh."
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
                              placeholder="tieu-de-trang-khong-dau"
                              onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
                            />
                            <FieldDescription>
                              Đường dẫn: <span className="font-medium text-primary">/{field.value || "slug"}</span>
                            </FieldDescription>
                            <FieldError errors={[fieldState.error]} />
                          </>
                        )}
                      />
                    </FieldContent>
                  </Field>
              </div>

              <Field>
                <FieldLabel className="mb-2 font-medium text-foreground/80">
                  Nội dung trang
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
                        placeholder="Bắt đầu viết nội dung trang..."
                        uploadImage={async (file) => {
                           const webpFile = await convertToWebP(file);
                           const fileName = `pages/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
                           const { error } = await supabase.storage
                             .from("images")
                             .upload(fileName, webpFile, { contentType: "image/webp" });
                           if (error) throw error;
                           const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                           return data.publicUrl;
                        }}
                      />
                    )}
                  />
                </FieldContent>
              </Field>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-6">
                  <Field orientation="horizontal" className="w-auto gap-3 flex items-center">
                    <FieldLabel className="w-auto mb-0 font-medium">Hiển thị</FieldLabel>
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
