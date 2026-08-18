import { SeoAuditPanel } from "@/shared/components/organisms/layout/admin/seo-audit-panel";

export default function SeoAuditPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Kiểm tra SEO</h1>
        <p className="text-sm text-muted-foreground">
          Rà soát tiêu đề, mô tả SEO trên toàn bộ sản phẩm, tin tức, dự án và dịch vụ đã publish.
        </p>
      </div>
      <SeoAuditPanel />
    </div>
  );
}
