import { SeoAuditPanel } from "@/shared/components/organisms/layout/admin/seo-audit-panel";

export default function SeoAuditPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="type-title">Kiểm tra SEO</h1>
        <p className="type-body-sm text-muted-foreground">
          Rà soát tiêu đề, mô tả SEO trên toàn bộ sản phẩm, tin tức, dự án và dịch vụ đã publish.
        </p>
      </div>
      <SeoAuditPanel />
    </div>
  );
}
