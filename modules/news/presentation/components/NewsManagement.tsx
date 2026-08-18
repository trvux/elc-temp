"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/organisms/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { SeoSnippetPreview } from "@/shared/components/organisms/layout/admin/seo-snippet-preview";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldDescription,
  FieldError,
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

import { News } from "../../domain";
import {
  deleteNewsAction,
  getNewsAction,
} from "../actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getAuthorsAction } from "@/modules/author";
import { TagMultiSelect } from "@/shared/components/ui/tag-multi-select";
import { getNewsColumns } from "./NewsColumns";
import { useNewsForm } from "../hooks/useNewsForm";
import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";
import { generateSlug } from "@/shared/lib/helpers";

export function NewsManagement() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<News | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterIsPublished, setFilterIsPublished] = useState<string>("all");

  // Fetch Data
  const { data: news = [], isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await getNewsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data || [];
    },
  });

  const { data: authors = [] } = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const { data, error } = await getAuthorsAction();
      if (error) throw new Error(error);
      return data || [];
    },
  });

  // Custom Form Hook
  const {
    form,
    saveMutation,
    handleImageUpload,
    handleContentChange,
    uploading,
  } = useNewsForm(editing, () => setIsDialogOpen(false));

  const previewTitle = form.watch("title");
  const previewSlug = form.watch("slug");
  const previewMetaTitle = form.watch("metaTitle");
  const previewMetaDescription = form.watch("metaDescription");

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteNewsAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa tin tức");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });

  const filteredNews = useMemo(() => {
    return news.filter((n) => {
      const matchPublished =
        filterIsPublished === "all" ||
        (filterIsPublished === "true" ? n.isPublished : !n.isPublished);
      return matchPublished;
    });
  }, [news, filterIsPublished]);

  const columns = useMemo(
    () =>
      getNewsColumns({
        onEdit: (n) => {
          setEditing(n);
          form.reset({
            title: n.title,
            slug: n.slug,
            images: n.images || [],
            content: n.content as unknown,
            excerpt: n.excerpt || "",
            categoryId: n.categoryId || "",
            authorId: n.authorId || "",
            isPublished: n.isPublished,
            metaTitle: n.metaTitle || "",
            metaDescription: n.metaDescription || "",
            orderIndex: n.orderIndex,
            tagIds: (n.tags || []).map((t) => t.id),
          });
          setIsDialogOpen(true);
        },
        onDelete: setDeletingId,
      }),
    [form]
  );

  function openCreate() {
    setEditing(null);
    form.reset({
      title: "",
      slug: "",
      images: [],
      content: "",
      excerpt: "",
      categoryId: "",
      authorId: "",
      isPublished: true,
      metaTitle: "",
      metaDescription: "",
      orderIndex: 0,
      tagIds: [],
    });
    setIsDialogOpen(true);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tin tức</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các bài viết tin tức và nội dung cộng đồng.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm tin tức
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
        data={filteredNews}
        isLoading={isLoading}
        searchKey="title"
        searchPlaceholder="Tìm kiếm tiêu đề tin tức..."
      />

      <AdminDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditing(null);
        }}
        size="full"
        title={editing ? `Sửa bài viết` : "Thêm tin tức"}
        description="Cấu hình nội dung chi tiết cho bài viết tin tức."
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
                    name="images"
                    render={({ field }) => {
                      const current = field.value?.[0];
                      return (
                        <Field>
                          <FieldLabel>Ảnh bìa bài viết</FieldLabel>
                          <div className="flex flex-col gap-4">
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-dashed bg-muted/5 group transition-colors hover:bg-muted/10">
                              {current?.url ? (
                                <>
                                  <Image
                                    src={current.url}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 350px"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                      className="h-8 w-8 rounded-full"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X size={16} />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                                  <Upload size={24} className="text-muted-foreground mb-2" />
                                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                    {uploading ? "Đang tải..." : "Tải ảnh lên"}
                                  </span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                  />
                                </label>
                              )}
                            </div>
                            {current?.url && (
                              <Input
                                value={current.alt || ""}
                                onChange={(e) =>
                                  field.onChange([{ ...current, alt: e.target.value }])
                                }
                                placeholder="Mô tả ảnh (alt text)"
                                className="text-xs h-8"
                              />
                            )}
                          </div>
                        </Field>
                      );
                    }}
                  />

                  <div className="space-y-5">
                    <Controller
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <Field orientation="horizontal" className="justify-between border p-3 rounded-xl">
                          <FieldLabel className="font-normal">Hiển thị bài viết</FieldLabel>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="orderIndex"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Thứ tự sắp xếp</FieldLabel>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Danh mục liên kết</FieldLabel>
                          <Select
                            value={field.value || "none"}
                            onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Không liên kết danh mục" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Không liên kết danh mục</SelectItem>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="authorId"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Tác giả</FieldLabel>
                          <Select
                            value={field.value || "none"}
                            onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Không gán tác giả" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Không gán tác giả</SelectItem>
                              {authors.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  {a.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldDescription>
                            Hiển thị làm byline công khai trên bài viết.
                          </FieldDescription>
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="tagIds"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Thẻ (Tags)</FieldLabel>
                          <TagMultiSelect value={field.value || []} onChange={field.onChange} />
                          <FieldDescription>
                            Dùng để liên kết bài viết với sản phẩm/dự án cùng chủ đề.
                          </FieldDescription>
                        </Field>
                      )}
                    />
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-8">

                  <Controller
                    control={form.control}
                    name="title"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Tiêu đề bài viết *</FieldLabel>
                        <Input
                          {...field}
                          placeholder="VD: 5 mẹo tiết kiệm điện khi dùng máy lạnh"
                          onChange={(e) => {
                            field.onChange(e);
                            form.setValue("slug", generateSlug(e.target.value));
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
                        <FieldLabel>Slug / URL</FieldLabel>
                        <Input
                          {...field}
                          placeholder="vd: tieu-de-tin-tuc-khong-dau"
                          onChange={(e) => field.onChange(generateSlug(e.target.value))}
                        />
                        <FieldDescription>
                          Đường dẫn: <span className="text-primary font-medium">/tin-tuc/{field.value || "..."}</span>
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="excerpt"
                    render={({ field, fieldState }) => (
                      <Field>
                        <div className="flex items-center justify-between">
                          <FieldLabel>Tóm tắt</FieldLabel>
                          <span className="text-[11px] text-muted-foreground">{(field.value || "").length}/300</span>
                        </div>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Tóm tắt ngắn hiển thị ở trang danh sách tin tức..."
                          className="min-h-[80px]"
                        />
                        <FieldDescription>
                          Khác với mô tả SEO — đây là đoạn dẫn nhập hiển thị cho người đọc, không phải cho Google.
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
                        <div className="flex items-center justify-between">
                          <FieldLabel>Tiêu đề SEO</FieldLabel>
                          <span className="text-[11px] text-muted-foreground">{(field.value || "").length}/70</span>
                        </div>
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
                        <div className="flex items-center justify-between">
                          <FieldLabel>Mô tả SEO</FieldLabel>
                          <span className="text-[11px] text-muted-foreground">{(field.value || "").length}/160</span>
                        </div>
                        <Textarea {...field} value={field.value || ""} placeholder="Mô tả tóm tắt bài viết để hiển thị trên Google..." className="min-h-[80px]" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>
                <SeoSnippetPreview
                  title={previewMetaTitle || previewTitle || ""}
                  description={previewMetaDescription || ""}
                  url={`dienmayelc.com.vn/tin-tuc/${previewSlug || ""}`}
                />
              </div>

              {/* Editor Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold tracking-tight">Nội dung bài viết</h3>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tiptap</span>
                </div>
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <TiptapEditor
                      key={editing?.id ?? "new"}
                      value={field.value}
                      onChange={handleContentChange}
                      placeholder="Bắt đầu viết nội dung bài viết..."
                      uploadImage={async (file) => {
                        const webpFile = await convertToWebP(file);
                        return uploadImageFile(webpFile, "news", webpFile.name);
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
              {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật bài viết" : "Tạo bài viết"}
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
