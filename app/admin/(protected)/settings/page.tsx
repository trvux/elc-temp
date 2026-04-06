"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Settings = Record<string, string>;

const SETTINGS_CONFIG = [
  {
    section: "Hero Section",
    description: "Nội dung phần đầu trang chủ",
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
        label: "Nút CTA (text)",
        placeholder: "VD: Xem công trình",
        type: "input",
      },
      {
        key: "hero_cta_url",
        label: "Nút CTA (link)",
        placeholder: "VD: /projects",
        type: "input",
      },
    ],
  },
  {
    section: "Thông tin công ty",
    description: "Dùng cho SEO và footer",
    fields: [
      {
        key: "company_name",
        label: "Tên công ty",
        placeholder: "VD: Điện Máy ABC",
        type: "input",
      },
      {
        key: "company_short_desc",
        label: "Mô tả công ty",
        placeholder: "Mô tả ngắn về công ty...",
        type: "textarea",
      },
      {
        key: "company_address",
        label: "Địa chỉ chính",
        placeholder: "123 Nguyễn Văn A, Q.1, TP.HCM",
        type: "input",
      },
      {
        key: "company_phone",
        label: "Hotline",
        placeholder: "0909 123 456",
        type: "input",
      },
      {
        key: "company_email",
        label: "Email",
        placeholder: "contact@company.com",
        type: "input",
      },
    ],
  },
  {
    section: "SEO",
    description: "Tối ưu cho tìm kiếm Google",
    fields: [
      {
        key: "seo_title",
        label: "SEO Title",
        placeholder: "Điện Máy ABC - Bán & Sửa Chữa Điện Máy",
        type: "input",
      },
      {
        key: "seo_description",
        label: "SEO Description",
        placeholder: "Mô tả hiển thị trên Google (160 ký tự)",
        type: "textarea",
      },
      {
        key: "seo_keywords",
        label: "Keywords",
        placeholder: "điện máy, sửa chữa, máy lạnh, tủ lạnh...",
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
    setSettings((prev) => ({ ...prev, [key]: value }));
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
      toast.success("Đã lưu cài đặt");
    }

    setSaving(false);
  }

  if (loading)
    return (
      <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
    );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cài đặt</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình nội dung và SEO cho website
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu tất cả"}
        </Button>
      </div>

      <div className="space-y-6">
        {SETTINGS_CONFIG.map((section, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>{section.section}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      placeholder={field.placeholder}
                      value={settings[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <Input
                      placeholder={field.placeholder}
                      value={settings[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Đang lưu..." : "Lưu tất cả cài đặt"}
        </Button>
      </div>
    </div>
  );
}
