"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/organisms/layout/admin/delete-dialog";
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
import { ImageUpload } from "@/shared/components/ui/image-upload";

import { Author } from "../../domain";
import { deleteAuthorAction, getAuthorsAction } from "../actions";
import { getAuthorColumns } from "./AuthorColumns";
import { useAuthorForm } from "../hooks/useAuthorForm";

export function AuthorManagement() {
  const queryClient = useQueryClient();
  const [activeAuthor, setActiveAuthor] = useState<Author | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: authors = [], isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const { data, error } = await getAuthorsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { form, saveMutation, onNameChange } =
    useAuthorForm(activeAuthor, () => setActiveAuthor(null));

  const deleteMutation = useMutation({
    mutationFn: deleteAuthorAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa tác giả");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["authors"] });
    },
  });

  const columns = useMemo(
    () =>
      getAuthorColumns({
        onEdit: (a) => {
          setActiveAuthor(a);
          form.reset({
            name: a.name,
            slug: a.slug,
            avatarUrl: a.avatarUrl || "",
            bio: a.bio || "",
          });
        },
        onDelete: setDeletingId,
      }),
    [form]
  );

  function openCreate() {
    setActiveAuthor("new");
    form.reset({ name: "", slug: "", avatarUrl: "", bio: "" });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tác giả</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý người viết bài cho blog/tin tức — dùng làm byline hiển thị công khai.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm tác giả
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={authors}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm kiếm tác giả..."
      />

      <AdminDialog
        open={!!activeAuthor}
        onOpenChange={(open) => !open && setActiveAuthor(null)}
        title={activeAuthor === "new" ? "Thêm tác giả" : "Sửa tác giả"}
        description="Thông tin người viết, hiển thị công khai trên bài blog/tin tức."
        size="lg"
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex-1 flex flex-col min-h-0 w-full"
        >
          <div className="flex-1 overflow-y-auto p-6">
            <FieldGroup className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 flex flex-col gap-5">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Tên tác giả *</FieldLabel>
                      <Input
                        {...field}
                        placeholder="VD: Nguyễn Văn A"
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
                      <FieldLabel>Slug</FieldLabel>
                      <Input {...field} placeholder="vd: nguyen-van-a" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="bio"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Tiểu sử</FieldLabel>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Vài dòng giới thiệu về tác giả..."
                        className="min-h-[100px] resize-y"
                      />
                      <FieldDescription>
                        Hiển thị ở cuối bài viết, hỗ trợ E-E-A-T cho SEO.
                      </FieldDescription>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>

              <div className="md:col-span-4 flex justify-start md:justify-center">
                <Controller
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <Field className="max-w-[200px] w-full">
                      <FieldLabel>Ảnh đại diện</FieldLabel>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        aspectRatio="1:1"
                        folderPath="authors"
                      />
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
            <Button variant="ghost" type="button" onClick={() => setActiveAuthor(null)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu thông tin"}
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
