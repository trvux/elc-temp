"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Import the "Beautiful" Field components
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Field,
  FieldLabel,
  FieldContent,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Settings = Record<string, string>;

const SETTINGS_CONFIG = [
  {
    section: "Trang chủ (Hero Section)",
    description: "Cấu hình nội dung tiêu đề và nút kêu gọi hành động (CTA) đầu trang chủ.",
    fields: [
      {
        key: "hero_title",
        label: "Tiêu đề chính",
        placeholder: "VD: Điện Máy ABC",
        type: "input",
      },
      {
        key: "hero_subtitle",
        label: "Mô tả ngắn",
        placeholder: "VD: Chuyên bán điện máy & dịch vụ sửa chữa",
        type: "textarea",
      },
      {
        key: "hero_cta_text",
        label: "Nội dung nút CTA",
        placeholder: "VD: Xem công trình",
        type: "input",
      },
      {
        key: "hero_cta_url",
        label: "Đường dẫn nút CTA",
        placeholder: "VD: /cong-trinh",
        type: "input",
      },
    ],
  },
  {
    section: "Thông tin công ty",
    description: "Thông tin cơ bản dùng cho các thẻ SEO, chân trang (Footer) và trang liên diện.",
    fields: [
      {
        key: "company_name",
        label: "Tên chính thức công ty",
        placeholder: "VD: Công ty Điện Máy ABC",
        type: "input",
      },
      {
        key: "company_short_desc",
        label: "Mô tả ngắn gọn",
        placeholder: "Mô tả vắn tắt về lĩnh vực hoạt động...",
        type: "textarea",
      },
      {
        key: "company_address",
        label: "Địa chỉ văn phòng",
        placeholder: "123 Nguyễn Văn A, Q.1, TP.HCM",
        type: "input",
      },
      {
        key: "company_phone",
        label: "Số điện thoại Hotline",
        placeholder: "0909 123 456",
        type: "input",
      },
      {
        key: "company_email",
        label: "Địa chỉ Email hỗ trợ",
        placeholder: "contact@company.com",
        type: "input",
      },
    ],
  },
  {
    section: "Cấu hình SEO Tổng thể",
    description: "Cài đặt mặc định cho việc tối ưu hóa công cụ tìm kiếm trên toàn trang web.",
    fields: [
      {
        key: "seo_title",
        label: "SEO Global Title",
        placeholder: "Điện Máy ABC - Giải pháp điện lạnh chuyên nghiệp",
        type: "input",
      },
      {
        key: "seo_description",
        label: "SEO Global Description",
        placeholder: "Mô tả hiển thị mặc định trên Google...",
        type: "textarea",
      },
      {
        key: "seo_keywords",
        label: "Từ khóa chính (Keywords)",
        placeholder: "điện máy, sửa chữa máy lạnh, lắp đặt điện lạnh...",
        type: "input",
      },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function fetchSettings() {
    const { data } = await supabase.from("site_settings").select("*");
    const map: Settings = {};
    data?.forEach((row) => {
      map[row.key] = row.value || "";
    });
    setSettings(map);
    setLoading(false);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  function handleChange(key: string, value: string) {
    // Tự động viết hoa chữ cái đầu cho các trường văn bản, trừ các trường kỹ thuật
    const isTechnicalField = key.includes("url") || key.includes("email") || key.includes("phone") || key.includes("keywords");
    const finalValue = !isTechnicalField && value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    
    setSettings((prev) => ({ ...prev, [key]: finalValue }));
  }

  async function handleSave() {
    setSaving(true);

    const upserts = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }));
    const { error } = await supabase.from("site_settings").upsert(upserts);

    if (error) {
      toast.error("Lỗi lưu cài đặt");
    } else {
      toast.success("Đã lưu tất cả cài đặt");
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
          <h1 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý nội dung trang chủ, thông tin doanh nghiệp và cấu hình SEO.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {SETTINGS_CONFIG.map((section, i) => (
          <Card key={i} className="overflow-hidden border-muted/60 shadow-sm">
            <CardHeader className="bg-muted/10">
              <CardTitle className="text-lg">{section.section}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 space-y-6">
              {section.fields.map((field) => (
                <Field key={field.key}>
                  <FieldLabel className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground/80">
                    {field.label}
                  </FieldLabel>
                  <FieldContent>
                    {field.type === "textarea" ? (
                      <Textarea
                        placeholder={field.placeholder}
                        value={settings[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={settings[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                    )}
                  </FieldContent>
                </Field>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="px-10">
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </div>
    </div>
  );
}
