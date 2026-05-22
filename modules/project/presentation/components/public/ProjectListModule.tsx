import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProjects } from "@/modules/project/application/getProjects";
import { getServiceTypes } from "@/modules/service-type/application";
import { getCategoriesNew } from "@/modules/category-new/application";
import { createClient } from "@/shared/lib/supabase/server";
import { ProjectFilterBar } from "./ProjectFilterBar";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import {
  TypographyH1,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ServiceTypeWithCategories } from "@/modules/service-type/domain/types";

interface ProjectListModuleProps {
  serviceType?: ServiceTypeWithCategories | null;
  searchParams: { [key: string]: string | string[] | undefined };
}

const STYLES = {
  main: "w-full px-4 py-12 md:px-8 bg-background min-h-screen",
  container: "mx-auto w-full max-w-7xl flex flex-col gap-8 md:gap-12",
  header: "flex flex-col items-center text-center gap-4 max-w-3xl mx-auto",
  title: "tracking-tight font-bold text-4xl md:text-5xl text-foreground",
  subtitle: "text-base md:text-lg text-muted-foreground leading-relaxed",
  badgeWrapper: "flex items-center gap-2 mt-2",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12",
  emptyState: "py-24 text-center border border-dashed border-border rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-4 max-w-lg mx-auto w-full",
  emptyText: "text-muted-foreground italic text-sm",
  footer: "border-t border-border/60 pt-8 mt-16 flex flex-col sm:flex-row justify-between items-center gap-6 text-muted-foreground",
  scrollToTop: "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors text-xs font-semibold uppercase tracking-wider",
};

export async function ProjectListModule({
  serviceType = null,
  searchParams,
}: ProjectListModuleProps) {
  const categoryParam = searchParams.category;
  const categorySlugs = typeof categoryParam === "string"
    ? categoryParam.split(",").filter(Boolean)
    : Array.isArray(categoryParam)
      ? categoryParam
      : [];
  const searchVal = typeof searchParams.search === "string" ? searchParams.search.trim() : undefined;

  // 1. Fetch filtered projects
  const projects = await getProjects({
    isPublished: true,
    serviceTypeId: serviceType?.id || undefined,
    categoryNewSlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
    search: searchVal,
  });

  // Sort projects: featured first, then order index
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.orderIndex - b.orderIndex;
  });

  // 2. Fetch service types for filtering
  const allServiceTypes = await getServiceTypes();
  const activeServiceTypes = allServiceTypes.filter((st) => !st.deletedAt);
  const serviceTypeItems = activeServiceTypes.map((st) => ({
    id: st.id,
    name: st.name,
    slug: st.slug || "",
  }));

  // 3. Setup categories for the active service type or all active categories
  let filterCategories: { id: string; name: string; slug: string }[] = [];
  if (serviceType) {
    // 1. Get default categories defined on the service type
    const defaultCategories = (serviceType.categories || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug || "",
    }));

    // 2. Fetch categories from projects under this service type
    const supabase = await createClient();
    const { data: relData, error: relError } = await supabase
      .from("project_category")
      .select(`
        category:categories(id, name, slug, deleted_at),
        projects!inner(id, service_type_id, is_published, deleted_at)
      `)
      .eq("projects.service_type_id", serviceType.id)
      .eq("projects.is_published", true)
      .is("projects.deleted_at", null)
      .is("categories.deleted_at", null);

    // Merge and deduplicate
    const categoryMap = new Map<string, { id: string; name: string; slug: string }>();

    // Add default ones first
    defaultCategories.forEach((cat) => {
      categoryMap.set(cat.id, cat);
    });

    // Add project-specific ones
    if (relData && !relError) {
      const typedData = relData as unknown as {
        category: { id: string; name: string; slug: string; deleted_at: string | null } | null;
        projects: { id: string; service_type_id: string | null; is_published: boolean; deleted_at: string | null } | null;
      }[];
      
      typedData.forEach((row) => {
        const cat = row.category;
        if (cat) {
          categoryMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            slug: cat.slug || "",
          });
        }
      });
    }

    filterCategories = Array.from(categoryMap.values());
  } else {
    const allCategories = await getCategoriesNew({ includeDeleted: false });
    filterCategories = allCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug || "",
    }));
  }

  // Breadcrumbs items
  const breadcrumbItems = [
    { label: "Dự án", href: serviceType ? "/du-an" : undefined, active: !serviceType },
    ...(serviceType ? [{ label: serviceType.name, active: true }] : []),
  ];

  // Dynamic header text
  const pageTitle = serviceType ? `Dự án ${serviceType.name}` : "Dự án tiêu biểu";
  const pageSubtitle = serviceType
    ? `Các công trình thiết kế và thi công hệ thống cơ điện, điều hòa không khí thuộc loại hình ${serviceType.name} do ELC thực hiện.`
    : "Tổng hợp các công trình tiêu biểu do đội ngũ ELC trực tiếp tư vấn, thiết kế và thi công lắp đặt cho khách hàng toàn quốc.";

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero Header Section */}
        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>
            {pageTitle}
          </TypographyH1>
          <p className={STYLES.subtitle}>
            {pageSubtitle}
          </p>
          <div className={STYLES.badgeWrapper}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              {projects.length} {projects.length === 1 ? "dự án" : "dự án"} được tìm thấy
            </span>
          </div>
        </header>

        {/* Dynamic Filters Section */}
        <div className="flex flex-col gap-6 w-full">
          <Suspense fallback={<div className="h-28 w-full animate-pulse bg-muted rounded-md" />}>
            <ProjectFilterBar
              serviceTypes={serviceTypeItems}
              currentServiceTypeSlug={serviceType?.slug || ""}
              categories={filterCategories}
              currentCategorySlugs={categorySlugs}
              initialSearch={searchVal || ""}
            />
          </Suspense>
        </div>

        {/* Project Cards Grid */}
        {sortedProjects.length > 0 ? (
          <div className={STYLES.grid}>
            {sortedProjects.map((project, index) => {
              const detailUrl = `/du-an/${project.slug}`;
              const displayCategory = project.categoriesNew?.[0]?.name || project.serviceType?.name || "Dự án ELC";
              const isFeatured = project.isFeatured;

              return (
                <Link
                  key={project.id}
                  href={detailUrl}
                  className="w-full flex focus:outline-none"
                >
                  <Card
                    className="w-full pt-0 flex flex-col group overflow-hidden border border-border/50 hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg"
                  >
                    {/* Image wrapper */}
                    <div className="relative overflow-hidden aspect-[16/10]">
                      <div className="absolute inset-0 z-10 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {project.images?.[0] ? (
                        <Image
                          src={project.images[0]}
                          alt={project.title}
                          fill
                          className="relative z-0 object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
                          priority={index < 3}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] tracking-widest uppercase text-muted-foreground/40 bg-muted">
                          Chưa có ảnh dự án
                        </div>
                      )}
                    </div>

                    {/* Card Header & Content */}
                    <CardHeader className="flex-1 p-5 gap-2">
                      <div>
                        {isFeatured ? (
                          <Badge
                            variant="secondary"
                            className="text-amber-700 bg-amber-50 border-amber-100/50 flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider"
                          >
                            <Sparkles className="w-3 h-3 fill-amber-700 text-amber-700" />
                            Tiêu biểu
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-primary bg-primary/5 border-primary/10 font-semibold text-[10px] uppercase tracking-wider"
                          >
                            {displayCategory}
                          </Badge>
                        )}
                      </div>
                      
                      <CardTitle className="group-hover:text-primary transition-colors text-lg font-bold leading-snug line-clamp-2 mt-1">
                        {project.title}
                      </CardTitle>
                      
                      <CardDescription className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-3">
                        {project.metaDescription || "Dự án thi công hoàn thiện hệ thống cơ điện bởi đội ngũ chuyên nghiệp ELC. Mang đến giải pháp tối ưu cho khách hàng."}
                      </CardDescription>
                    </CardHeader>

                    {/* Card Footer */}
                    <CardFooter className="p-5 pt-0 mt-auto">
                      <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-xs font-semibold transition-all duration-300">
                        <span>Xem chi tiết dự án</span>
                        <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className={STYLES.emptyState}>
            <p className={STYLES.emptyText}>
              Không tìm thấy dự án nào khớp với bộ lọc hoặc tìm kiếm của bạn.
            </p>
            <Link href={serviceType ? `/du-an/${serviceType.slug}` : "/du-an"}>
              <Button size="sm" variant="outline">
                Xóa tất cả bộ lọc
              </Button>
            </Link>
          </div>
        )}

        {/* Premium Footer */}
        <footer className={STYLES.footer}>
          <TypographySmall className="text-xs text-muted-foreground/75">
            &copy; {new Date().getFullYear()} ELC Holdings. Mọi quyền được bảo lưu.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <span>Quay lại đầu trang</span>
          </ScrollToTop>
        </footer>
      </div>

      {/* JSON-LD Schema markup for Google Rich Snippets */}
      {(() => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";
        const schema = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": pageTitle,
          "description": pageSubtitle,
          "url": serviceType ? `${baseUrl}/du-an/${serviceType.slug}` : `${baseUrl}/du-an`,
          "numberOfItems": sortedProjects.length,
          "itemListElement": sortedProjects.map((p, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "url": `${baseUrl}/du-an/${p.slug}`,
            "name": p.title,
            "image": p.images?.[0] || ""
          }))
        };
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        );
      })()}
    </main>
  );
}
