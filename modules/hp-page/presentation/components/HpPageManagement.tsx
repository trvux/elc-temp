"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowSquareOut } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { ImageUpload } from "@/shared/components/ui/image-upload";

import { getAttributeDefinitionsAction } from "@/modules/attribute-definition";

import { HpPage } from "../../domain";
import { deleteHpPageAction, getHpPagesAction } from "../actions";
import { getHpPageColumns } from "./HpPageColumns";
import { useHpPageForm } from "../hooks/useHpPageForm";
import { AttributeValueMultiSelect } from "./AttributeValueMultiSelect";

export function HpPageManagement() {
  const queryClient = useQueryClient();
  const [activePage, setActivePage] = useState<HpPage | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["hp-pages"],
    queryFn: async () => {
      const { data, error } = await getHpPagesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: attributeDefinitions = [] } = useQuery({
    queryKey: ["attribute-definitions"],
    queryFn: async () => {
      const { data, error } = await getAttributeDefinitionsAction();
      if (error) throw new Error(error);
      return data;
    },
  });
  // Only select/multiselect attributes have a fixed option list a facet
  // token can match against — number/text/boolean attributes don't fit
  // this landing-page mechanism (facet_tokens only covers enum-like values).
  const selectableAttributes = attributeDefinitions.filter(
    (a) => a.dataType === "select" || a.dataType === "multiselect"
  );

  const { form, saveMutation, onNameChange } =
    useHpPageForm(activePage, () => setActivePage(null));

  const selectedAttributeCode = form.watch("attributeCode");
  const selectedAttributeDefinition = attributeDefinitions.find((a) => a.code === selectedAttributeCode);

  const deleteMutation = useMutation({
    mutationFn: deleteHpPageAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa trang công suất");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["hp-pages"] });
    },
  });

  const columns = useMemo(
    () =>
      getHpPageColumns({
        onEdit: (p) => {
          setActivePage(p);
          form.reset({
            name: p.name,
            slug: p.slug,
            imageUrl: p.imageUrl || "",
            orderIndex: p.orderIndex || 0,
            metaTitle: p.metaTitle || "",
            metaDescription: p.metaDescription || "",
            content: p.content || "",
            attributeCode: p.attributeCode,
            attributeValues: p.attributeValues,
          });
        },
        onDelete: setDeletingId,
      }),
    [form]
  );

  function openCreate() {
    setActivePage("new");
    form.reset({
      name: "",
      slug: "",
      imageUrl: "",
      orderIndex: 0,
      metaTitle: "",
      metaDescription: "",
      content: "",
      attributeCode: "phan_khuc_hp",
      attributeValues: [],
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trang công suất (HP)</h1>
          <p className="text-sm text-muted-foreground">
            Trang landing SEO theo mức công suất máy lạnh (VD "Máy lạnh 1HP"), liệt kê sản phẩm trên toàn bộ danh mục.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm trang
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={pages}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm kiếm trang..."
      />

      <AdminDialog
        open={!!activePage}
        onOpenChange={(open) => !open && setActivePage(null)}
        title={activePage === "new" ? "Thêm trang công suất" : "Sửa trang công suất"}
        description="Nhập thông tin trang landing và chọn giá trị công suất cần lọc."
        size="full"
      >
        <Tabs defaultValue="info" className="flex flex-col flex-1 min-h-0 relative w-full">
          <div className="flex sticky top-0 z-20 w-full items-center justify-center border-b bg-background/95 py-4 backdrop-blur">
            <TabsList>
              <TabsTrigger value="info">Thông tin chung</TabsTrigger>
              <TabsTrigger value="filter">Cấu hình lọc</TabsTrigger>
              <TabsTrigger value="seo">Cấu hình SEO</TabsTrigger>
              <TabsTrigger value="content">Bài viết</TabsTrigger>
            </TabsList>
          </div>

          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0">
            <form
              onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
              className="flex-1 flex flex-col min-h-0 w-full"
            >
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                <TabsContent value="info" className="m-0 space-y-6">
                  <FieldGroup className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-8 flex flex-col gap-5">
                      <Controller
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Tên trang *</FieldLabel>
                            <Input
                              {...field}
                              placeholder="VD: Máy lạnh 1HP"
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
                            <FieldLabel>Slug / Đường dẫn (Tự động)</FieldLabel>
                            <Input {...field} placeholder="vd: may-lanh-1hp" />
                            <FieldDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <ArrowSquareOut size={12} />
                              /san-pham/{field.value || "..."}
                            </FieldDescription>
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />

                      <Controller
                        control={form.control}
                        name="orderIndex"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>Thứ tự hiển thị</FieldLabel>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            <FieldDescription>Thứ tự sắp xếp nhỏ đến lớn.</FieldDescription>
                          </Field>
                        )}
                      />
                    </div>

                    <div className="md:col-span-4 flex justify-start md:justify-center">
                      <Controller
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <Field className="max-w-[240px] w-full">
                            <FieldLabel>Ảnh đại diện</FieldLabel>
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              aspectRatio="1:1"
                              folderPath="hp-pages"
                            />
                          </Field>
                        )}
                      />
                    </div>
                  </FieldGroup>
                </TabsContent>

                <TabsContent value="filter" className="m-0 space-y-6">
                  <div className="max-w-2xl space-y-6">
                    <Controller
                      control={form.control}
                      name="attributeCode"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Thuộc tính lọc *</FieldLabel>
                          <Select
                            value={field.value}
                            onValueChange={(code) => {
                              field.onChange(code);
                              // Values belonged to the previous attribute's
                              // option list — clear them.
                              form.setValue("attributeValues", []);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn thuộc tính" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectableAttributes.map((a) => (
                                <SelectItem key={a.code} value={a.code}>
                                  {a.name} ({a.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldDescription>
                            Trang sẽ liệt kê sản phẩm có thuộc tính này khớp giá trị chọn bên dưới, trên toàn bộ danh mục.
                          </FieldDescription>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="attributeValues"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Giá trị *</FieldLabel>
                          <AttributeValueMultiSelect
                            options={selectedAttributeDefinition?.options ?? []}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Chọn giá trị công suất..."
                            disabled={!selectedAttributeDefinition}
                          />
                          <FieldDescription>
                            Có thể chọn nhiều giá trị để gộp vào 1 trang (VD "1 HP" và "1.5 HP" cùng lúc).
                          </FieldDescription>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="m-0 space-y-6">
                  <div className="max-w-2xl space-y-6">
                    <Controller
                      control={form.control}
                      name="metaTitle"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Tiêu đề SEO</FieldLabel>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Để trống sẽ tự động dùng tên trang..."
                          />
                          <FieldDescription>
                            Tiêu đề hiển thị trên thanh tiêu đề trình duyệt và kết quả tìm kiếm Google. Nên nhắc cả cách gọi "HP" và "ngựa".
                          </FieldDescription>
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
                            placeholder="Mô tả tóm tắt trang hiển thị trên Google..."
                            className="min-h-[120px] resize-y"
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="content" className="m-0 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight">Bài viết chi tiết SEO</h3>
                        <p className="text-[11px] text-muted-foreground">Nội dung hiển thị ở cuối danh sách sản phẩm.</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tiptap Editor</span>
                    </div>
                    <Controller
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <TiptapEditor
                          key={activePage === "new" ? "new" : activePage?.id}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Bắt đầu viết bài viết tối ưu SEO tại đây..."
                          uploadImage={async (file) => {
                            const webpFile = await convertToWebP(file);
                            return uploadImageFile(webpFile, "hp-pages", webpFile.name);
                          }}
                        />
                      )}
                    />
                  </div>
                </TabsContent>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0 z-20">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setActivePage(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Đang lưu..." : "Lưu thông tin"}
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
