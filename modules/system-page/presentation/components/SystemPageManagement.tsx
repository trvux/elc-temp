"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

import { SystemPage, updateSystemPageSchema } from "../../domain";
import { getSystemPagesAction, updateSystemPageAction } from "../actions";
import { getSystemPageColumns } from "./SystemPageColumns";

interface SystemPageFormValues {
  id: string;
  metaTitle: string;
  metaDescription: string;
}

export function SystemPageManagement() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SystemPage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: systemPages = [], isLoading } = useQuery({
    queryKey: ["system-pages"],
    queryFn: async () => {
      const { data, error } = await getSystemPagesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const form = useForm<SystemPageFormValues>({
    resolver: standardSchemaResolver(updateSystemPageSchema) as unknown as Resolver<SystemPageFormValues>,
    defaultValues: {
      id: "",
      metaTitle: "",
      metaDescription: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: SystemPageFormValues) => {
      if (!editing) throw new Error("No page selected for editing");
      return updateSystemPageAction({
        id: values.id,
        metaTitle: values.metaTitle || null,
        metaDescription: values.metaDescription || null,
      });
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Cập nhật SEO trang hệ thống thành công");
      setIsDialogOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["system-pages"] });
    },
  });

  const columns = useMemo(
    () =>
      getSystemPageColumns({
        onEdit: (page) => {
          setEditing(page);
          form.reset({
            id: page.id,
            metaTitle: page.metaTitle || "",
            metaDescription: page.metaDescription || "",
          });
          setIsDialogOpen(true);
        },
      }),
    [form]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">SEO Trang hệ thống</h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình Tiêu đề và Mô tả SEO cho các trang hub chính của website.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={systemPages}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm kiếm trang..."
      />

      <AdminDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditing(null);
        }}
        size="lg"
        title="Sửa cấu hình SEO trang"
        description={`Cấu hình thẻ tiêu đề và thẻ mô tả cho trang ${editing?.name || ""}.`}
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Field>
                <FieldLabel>Tên trang</FieldLabel>
                <Input value={editing?.name || ""} disabled className="bg-muted" />
              </Field>

              <Field>
                <FieldLabel>Đường dẫn (Slug)</FieldLabel>
                <Input value={editing?.slug === "home" ? "/" : `/${editing?.slug || ""}`} disabled className="bg-muted" />
              </Field>

              <Controller
                control={form.control}
                name="metaTitle"
                render={({ field, fieldState }) => (
                  <Field>
                    <div className="flex justify-between items-center w-full">
                      <FieldLabel>Tiêu đề SEO</FieldLabel>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {(field.value || "").length}/70 ký tự (Khuyên dùng)
                      </span>
                    </div>
                    <Input {...field} value={field.value || ""} placeholder="Nhập tiêu đề hiển thị trên Google..." />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="metaDescription"
                render={({ field, fieldState }) => (
                  <Field>
                    <div className="flex justify-between items-center w-full">
                      <FieldLabel>Mô tả SEO</FieldLabel>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {(field.value || "").length}/160 ký tự (Khuyên dùng)
                      </span>
                    </div>
                    <Textarea {...field} value={field.value || ""} placeholder="Nhập mô tả tóm tắt nội dung trang để hiển thị trên Google..." className="min-h-[120px]" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </div>
        </form>
      </AdminDialog>
    </div>
  );
}
