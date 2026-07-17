"use client";

import { useQuery } from "@tanstack/react-query";
import { WarningCircle, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";

import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { getNewsAction } from "@/modules/news/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getServicesAction } from "@/modules/service/presentation/actions";

const TITLE_LIMIT = 70;
const DESCRIPTION_LIMIT = 160;

interface AuditRow {
  type: "Sản phẩm" | "Tin tức" | "Dự án" | "Dịch vụ";
  name: string;
  editHref: string;
  title: string;
  description: string;
  noindex: boolean;
}

// Reads the same fallback chain generateMetadata() uses (seo.* first, then
// legacy metaTitle/metaDescription) so this panel reports what Google will
// actually see, not just what's stored in the new field.
function effectiveTitle(name: string, seo?: { title?: string | null }, metaTitle?: string | null): string {
  return seo?.title || metaTitle || name;
}

function effectiveDescription(seo?: { description?: string | null }, metaDescription?: string | null): string {
  return seo?.description || metaDescription || "";
}

export function SeoAuditPanel() {
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["seo-audit", "products"],
    queryFn: async () => {
      const { data } = await getProductsAction({ isPublished: true, limit: 2000 });
      return data;
    },
  });

  const { data: news, isLoading: loadingNews } = useQuery({
    queryKey: ["seo-audit", "news"],
    queryFn: async () => {
      const { data } = await getNewsAction({ isPublished: true });
      return data;
    },
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["seo-audit", "projects"],
    queryFn: async () => {
      const { data } = await getProjectsAction({ isPublished: true, limit: 2000 });
      return data;
    },
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["seo-audit", "services"],
    queryFn: async () => {
      const { data } = await getServicesAction({ isPublished: true });
      return data;
    },
  });

  const isLoading = loadingProducts || loadingNews || loadingProjects || loadingServices;

  const rows: AuditRow[] = [
    ...(products || []).map((p) => ({
      type: "Sản phẩm" as const,
      name: p.name,
      editHref: "/admin/products",
      title: effectiveTitle(p.name, p.seo, p.metaTitle),
      description: effectiveDescription(p.seo, p.metaDescription),
      noindex: p.seo?.noindex || false,
    })),
    ...(news || []).map((n) => ({
      type: "Tin tức" as const,
      name: n.title,
      editHref: "/admin/news",
      title: effectiveTitle(n.title, n.seo, n.metaTitle),
      description: effectiveDescription(n.seo, n.metaDescription),
      noindex: n.seo?.noindex || false,
    })),
    ...(projects || []).map((p) => ({
      type: "Dự án" as const,
      name: p.title,
      editHref: "/admin/projects",
      title: effectiveTitle(p.title, p.seo, p.metaTitle),
      description: effectiveDescription(p.seo, p.metaDescription),
      noindex: p.seo?.noindex || false,
    })),
    ...(services || []).map((s) => ({
      type: "Dịch vụ" as const,
      name: s.title,
      editHref: "/admin/services",
      title: effectiveTitle(s.title, s.seo, s.metaTitle),
      description: effectiveDescription(s.seo, s.metaDescription),
      noindex: s.seo?.noindex || false,
    })),
  ];

  // Duplicate description = same non-empty description text reused across
  // 2+ entries — a real Search Console "duplicate meta descriptions" issue,
  // not just a display nuisance.
  const descriptionCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.description) continue;
    descriptionCounts.set(row.description, (descriptionCounts.get(row.description) || 0) + 1);
  }

  const issues = rows
    .map((row) => {
      const problems: string[] = [];
      if (!row.description) problems.push("Thiếu mô tả SEO");
      if (row.title.length > TITLE_LIMIT) problems.push(`Tiêu đề quá dài (${row.title.length}/${TITLE_LIMIT})`);
      if (row.description && row.description.length > DESCRIPTION_LIMIT) {
        problems.push(`Mô tả quá dài (${row.description.length}/${DESCRIPTION_LIMIT})`);
      }
      if (row.description && (descriptionCounts.get(row.description) || 0) > 1) {
        problems.push("Mô tả trùng với trang khác");
      }
      if (row.noindex) problems.push("Đang ẩn khỏi kết quả tìm kiếm (noindex)");
      return { ...row, problems };
    })
    .filter((row) => row.problems.length > 0);

  if (isLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {issues.length === 0 ? (
          <>
            <CheckCircle size={20} className="text-green-600" weight="fill" />
            <p className="text-sm text-muted-foreground">
              Không tìm thấy vấn đề SEO nào trong {rows.length} trang đã publish.
            </p>
          </>
        ) : (
          <>
            <WarningCircle size={20} className="text-amber-500" weight="fill" />
            <p className="text-sm text-muted-foreground">
              Tìm thấy {issues.length}/{rows.length} trang có vấn đề SEO cần xem lại.
            </p>
          </>
        )}
      </div>

      {issues.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Vấn đề</TableHead>
              <TableHead className="text-right">Sửa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="whitespace-nowrap">{row.type}</TableCell>
                <TableCell className="max-w-[280px] truncate">{row.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {row.problems.map((p, j) => (
                      <Badge key={j} variant="outline" className="text-[11px] font-normal">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={row.editHref} className="text-primary text-sm hover:underline">
                    Đi tới
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
