"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Json } from "@/modules/catalog/domain";
import { getCatalogPageAction, updateCatalogPageAction } from "@/modules/catalog/presentation/actions";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { uploadImageFile } from "@/shared/lib/upload-image";

export default function CatalogPagePage() {
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [content, setContent] = useState<Json | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchCatalogPage() {
      const res = await getCatalogPageAction();
      if (!active) return;
      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        setMetaTitle(res.data.metaTitle || "");
        setMetaDescription(res.data.metaDescription || "");
        setContent(res.data.content ?? null);
      }
      setLoading(false);
    }
    fetchCatalogPage();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await updateCatalogPageAction({
      content,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Đã lưu cấu hình trang \"Tất cả sản phẩm\"");
    }
    setSaving(false);
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium">Đang tải cấu hình...</p>
      </div>
    );

  return (
    <div className="max-w-4xl pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trang &quot;Tất cả sản phẩm&quot;</h1>
          <p className="text-sm text-muted-foreground">
            Nội dung giới thiệu + SEO riêng cho trang catch-all liệt kê toàn bộ sản phẩm — chỉ có 1 trang duy nhất.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-border/40 shadow-sm rounded-2xl">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg font-bold tracking-tight">SEO</CardTitle>
          <CardDescription className="text-sm">Tiêu đề/mô tả hiển thị trên kết quả tìm kiếm Google.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-6">
          <Field>
            <FieldLabel className="mb-2 font-medium">Meta Title</FieldLabel>
            <FieldContent>
              <Input
                placeholder="VD: Tất cả sản phẩm - Điện máy ELC"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel className="mb-2 font-medium">Meta Description</FieldLabel>
            <FieldContent>
              <Input
                placeholder="Mô tả ngắn gọn hiển thị dưới tiêu đề trên Google..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/40 shadow-sm rounded-2xl mt-8">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg font-bold tracking-tight">Nội dung giới thiệu</CardTitle>
          <CardDescription className="text-sm">
            Đoạn giới thiệu hiển thị đầu trang &quot;Tất cả sản phẩm&quot;, phía trên danh sách danh mục.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <TiptapEditor
            value={content}
            onChange={(v) => setContent(v as Json)}
            placeholder="Giới thiệu tổng quan về toàn bộ catalog..."
            uploadImage={async (file) => uploadImageFile(file, "products")}
          />
        </CardContent>
      </Card>

      <div className="mt-10 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </Button>
      </div>
    </div>
  );
}
