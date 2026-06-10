"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";

import { Page } from "../../domain";
import {
  deletePageAction,
  getPagesAction,
} from "../actions";
import { getPageColumns } from "./PageColumns";
import { usePageForm } from "../hooks/usePageForm";
import { convertToWebP } from "@/shared/lib/image";
import { generateSlug } from "@/shared/lib/helpers";

export function PageManagement() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Page | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  // Fetch Data
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const { data, error } = await getPagesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Custom Form Hook
  const {
    form,
    saveMutation,
    handleContentChange,
    supabase,
  } = usePageForm(editing, () => setIsDialogOpen(false));

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deletePageAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa trang");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });

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
        onEdit: (p) => {
          setEditing(p);
          form.reset({
            title: p.title,
            slug: p.slug,
            content: p.content as any,
            isPublished: p.isPublished,
            orderIndex: p.orderIndex ?? 0,
            metaTitle: p.metaTitle || "",
            metaDescription: p.metaDescription || "",
          });
          setIsDialogOpen(true);
        },
        onDelete: (id) => setDeletingId(id),
      }),
    [form]
  );

  function openCreate() {
    setEditing(null);
    form.reset({
      title: "",
      slug: "",
      content: "",
      isPublished: true,
      orderIndex: 0,
      metaTitle: "",
      metaDescription: "",
    });
    setIsDialogOpen(true);
  }

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
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditing(null);
        }}
        size="full"
        title={editing ? `Sửa bài viết` : "Thêm trang mới"}
        description="Cấu hình nội dung chi tiết cho trang tĩnh."
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-8">
                  <Controller
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <Field orientation="horizontal" className="justify-between border p-3 rounded-xl">
                        <FieldLabel className="font-normal">Hiển thị trang</FieldLabel>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="orderIndex"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Thứ tự hiển thị (từ nhỏ đến lớn)</FieldLabel>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                        <FieldDescription>
                          Số nhỏ sẽ hiển thị trước (VD: 1, 2, 3...)
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>

                <div className="lg:col-span-8 space-y-8">


                  <Controller
                    control={form.control}
                    name="slug"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Slug / URL</FieldLabel>
                        <Input
                          {...field}
                          placeholder="vd: ve-chung-toi"
                          onChange={(e) => field.onChange(generateSlug(e.target.value))}
                        />
                        <FieldDescription>
                          Đường dẫn: <span className="text-primary font-medium">/{field.value || "..."}</span>
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
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
                        <Textarea {...field} value={field.value || ""} placeholder="Mô tả tóm tắt nội dung trang để hiển thị trên Google..." className="min-h-[80px]" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>
              </div>

              {/* Editor Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold tracking-tight">Nội dung trang</h3>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tiptap Editor</span>
                </div>
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <TiptapEditor
                      key={editing?.id ?? "new"}
                      value={field.value}
                      onChange={handleContentChange}
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
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật trang" : "Tạo trang"}
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
