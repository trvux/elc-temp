"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { SeoSnippetPreview } from "@/shared/components/layout/admin/seo-snippet-preview";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductSeoCardProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductSeoCard({ form }: ProductSeoCardProps) {
  const previewName = form.watch("name");
  const previewSlug = form.watch("slug");
  const previewSeoTitle = form.watch("seo.title");
  const previewSeoDescription = form.watch("seo.description");

  return (
    <FieldGroup className="gap-5">
      <Controller
        control={form.control}
        name="seo.title"
        render={({ field, fieldState }) => (
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Tiêu đề SEO</FieldLabel>
              <span className="text-[11px] text-muted-foreground">{(field.value || "").length}/70</span>
            </div>
            <Input {...field} value={field.value || ""} placeholder="Để trống sẽ tự động dùng tên sản phẩm..." />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="seo.description"
        render={({ field, fieldState }) => (
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Mô tả SEO</FieldLabel>
              <span className="text-[11px] text-muted-foreground">{(field.value || "").length}/160</span>
            </div>
            <Textarea
              {...field}
              value={field.value || ""}
              placeholder="Mô tả tóm tắt sản phẩm để hiển thị trên Google..."
              className="min-h-[80px]"
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="seo.noindex"
        render={({ field }) => (
          <Field>
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <Checkbox checked={field.value || false} onCheckedChange={(v) => field.onChange(!!v)} />
              <span>Ẩn khỏi kết quả tìm kiếm (noindex)</span>
            </label>
          </Field>
        )}
      />

      <SeoSnippetPreview
        title={previewSeoTitle || previewName || ""}
        description={previewSeoDescription || ""}
        url={`dienmayelc.com.vn/san-pham/${previewSlug || ""}`}
      />
    </FieldGroup>
  );
}
