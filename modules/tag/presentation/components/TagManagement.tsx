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
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";

import { Tag } from "../../domain";
import { deleteTagAction, getTagsAction } from "../actions";
import { getTagColumns } from "./TagColumns";
import { useTagForm } from "../hooks/useTagForm";

export function TagManagement() {
  const queryClient = useQueryClient();
  const [activeTag, setActiveTag] = useState<Tag | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await getTagsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { form, saveMutation, onNameChange } = useTagForm(activeTag, () => setActiveTag(null));

  const deleteMutation = useMutation({
    mutationFn: deleteTagAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa thẻ");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const columns = useMemo(
    () =>
      getTagColumns({
        onEdit: (t) => {
          setActiveTag(t);
          form.reset({ name: t.name, slug: t.slug });
        },
        onDelete: setDeletingId,
      }),
    [form]
  );

  function openCreate() {
    setActiveTag("new");
    form.reset({ name: "", slug: "" });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thẻ (Tags)</h1>
          <p className="text-sm text-muted-foreground">
            Taxonomy dùng chung cho tin tức, sản phẩm, dự án — dùng để liên kết nội dung liên quan với nhau.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm thẻ
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tags}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm kiếm thẻ..."
      />

      <AdminDialog
        open={!!activeTag}
        onOpenChange={(open) => !open && setActiveTag(null)}
        title={activeTag === "new" ? "Thêm thẻ" : "Sửa thẻ"}
        description="Thẻ dùng chung cho tin tức, sản phẩm, dự án."
        size="sm"
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex-1 flex flex-col min-h-0 w-full"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Tên thẻ *</FieldLabel>
                  <Input
                    {...field}
                    placeholder="VD: Máy lạnh Daikin"
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
                  <Input {...field} placeholder="vd: may-lanh-daikin" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
            <Button variant="ghost" type="button" onClick={() => setActiveTag(null)}>
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
