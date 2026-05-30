import { getCategoriesNew } from "@/modules/category-new/application";
import { getProjects } from "@/modules/project/application/getProjects";
import { getServiceTypes } from "@/modules/service-type/application";
import { ServiceTypeWithCategories } from "@/modules/service-type/domain/types";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { Button } from "@/shared/components/ui/button";
import {
  TypographyH1,
  TypographyLead,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { createClient } from "@/shared/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectFilterBar } from "./ProjectFilterBar";
import { ProjectCard } from "@/modules/project/presentation/components/ProjectCard";

interface ProjectListModuleProps {
  serviceType?: ServiceTypeWithCategories | null;
  searchParams: { [key: string]: string | string[] | undefined };
}

const STYLES = {
  main: "w-full px-4 py-12 md:px-8 bg-background min-h-screen",
  container: "mx-auto w-full max-w-7xl flex flex-col gap-8 md:gap-12",
  header: "flex flex-col items-center text-center gap-4 max-w-3xl mx-auto",
  badgeWrapper: "flex items-center gap-2 mt-2",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12 min-h-[450px] animate-fade-in-up",
  emptyState:
    "py-24 text-center border border-dashed border-border rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-4 max-w-lg mx-auto w-full min-h-[300px] animate-fade-in-up",
  emptyText: "text-muted-foreground italic text-sm",
  footer:
    "border-t border-border/60 pt-8 mt-16 flex flex-col sm:flex-row justify-between items-center gap-6 text-muted-foreground",
  scrollToTop:
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors text-xs font-semibold uppercase tracking-wider",
};

export async function ProjectListModule({
  serviceType = null,
  searchParams,
}: ProjectListModuleProps) {
  const categoryParam = searchParams.category;
  const categorySlugs =
    typeof categoryParam === "string"
      ? categoryParam.split(",").filter(Boolean)
      : Array.isArray(categoryParam)
        ? categoryParam
        : [];
  const searchVal =
    typeof searchParams.search === "string"
      ? searchParams.search.trim()
      : undefined;

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

  // Fetch all published projects to compute counts
  const allPublishedProjects = await getProjects({ isPublished: true });

  const serviceTypeItems = activeServiceTypes.map((st) => {
    const count = allPublishedProjects.filter(
      (p) => p.serviceTypeId === st.id,
    ).length;
    return {
      id: st.id,
      name: st.name,
      slug: st.slug || "",
      count,
    };
  });

  // 3. Setup categories for the active service type or all active categories
  let filterCategories: {
    id: string;
    name: string;
    slug: string;
    count: number;
  }[] = [];
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
      .select(
        `
        category:categories(id, name, slug, deleted_at),
        projects!inner(id, service_type_id, is_published, deleted_at)
      `,
      )
      .eq("projects.service_type_id", serviceType.id)
      .eq("projects.is_published", true)
      .is("projects.deleted_at", null)
      .is("categories.deleted_at", null);

    // Merge and deduplicate
    const categoryMap = new Map<
      string,
      { id: string; name: string; slug: string }
    >();

    // Add default ones first
    defaultCategories.forEach((cat) => {
      categoryMap.set(cat.id, cat);
    });

    // Add project-specific ones
    if (relData && !relError) {
      const typedData = relData as unknown as {
        category: {
          id: string;
          name: string;
          slug: string;
          deleted_at: string | null;
        } | null;
        projects: {
          id: string;
          service_type_id: string | null;
          is_published: boolean;
          deleted_at: string | null;
        } | null;
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

    filterCategories = Array.from(categoryMap.values()).map((cat) => {
      // For category counts, we only count projects within the current serviceType
      const count = allPublishedProjects.filter(
        (p) =>
          p.serviceTypeId === serviceType.id &&
          p.categoriesNew?.some((c) => c.id === cat.id),
      ).length;
      return { ...cat, count };
    });
  } else {
    const allCategories = await getCategoriesNew({ includeDeleted: false });
    filterCategories = allCategories.map((cat) => {
      const count = allPublishedProjects.filter((p) =>
        p.categoriesNew?.some((c) => c.id === cat.id),
      ).length;
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug || "",
        count,
      };
    });
  }

  // Breadcrumbs items
  const breadcrumbItems = [
    {
      label: "Dự án",
      href: serviceType ? "/du-an" : undefined,
      active: !serviceType,
    },
    ...(serviceType ? [{ label: serviceType.name, active: true }] : []),
  ];

  // Dynamic header text
  const pageTitle = serviceType
    ? `Dự án — ${serviceType.name}`
    : "Tất cả công trình tiêu biểu";

  const pageSubtitle = serviceType
    ? `Các công trình thiết kế và thi công hệ thống, điều hòa không khí trong không gian kiến trúc ${serviceType.name} do ELC thực hiện.`
    : "Tổng hợp các công trình tiêu biểu do đội ngũ ELC trực tiếp tư vấn, thiết kế và thi công lắp đặt cho khách hàng toàn quốc.";

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero Header Section */}
        <header className={STYLES.header}>
          <TypographyH1>
            {pageTitle}
          </TypographyH1>
          {serviceType ? (
            <TypographyLead>
              Các công trình thiết kế và thi công hệ thống, điều hòa không khí
              trong <br className="hidden sm:inline" />
              <span className="text-primary/90 font-semibold">
                không gian kiến trúc {serviceType.name} do ELC thực hiện.
              </span>
            </TypographyLead>
          ) : (
            <TypographyLead>
              Tổng hợp các công trình tiêu biểu do đội ngũ ELC trực tiếp tư vấn,
              thiết kế và thi công lắp đặt cho khách hàng toàn quốc.
            </TypographyLead>
          )}
        </header>

        {/* Dynamic Filters Section */}
        <div className="flex flex-col gap-6 w-full">
          <Suspense
            fallback={
              <div className="h-28 w-full animate-pulse bg-muted rounded-md" />
            }
          >
            <ProjectFilterBar
              serviceTypes={serviceTypeItems}
              currentServiceTypeSlug={serviceType?.slug || ""}
              categories={filterCategories}
              currentCategorySlugs={categorySlugs}
              initialSearch={searchVal || ""}
              totalServiceTypesCount={allPublishedProjects.length}
              totalCategoriesCount={
                serviceType
                  ? allPublishedProjects.filter(
                      (p) => p.serviceTypeId === serviceType.id,
                    ).length
                  : allPublishedProjects.length
              }
            />
          </Suspense>
        </div>

        {/* Project Cards Grid */}
        {sortedProjects.length > 0 ? (
          <div className={STYLES.grid}>
            {sortedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
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
            &copy; {new Date().getFullYear()} ELC Holdings. Mọi quyền được bảo
            lưu.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <span>Quay lại đầu trang</span>
          </ScrollToTop>
        </footer>
      </div>

      {/* JSON-LD Schema markup for Google Rich Snippets */}
      {(() => {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";
        const schema = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: pageTitle,
          description: pageSubtitle,
          url: serviceType
            ? `${baseUrl}/du-an/${serviceType.slug}`
            : `${baseUrl}/du-an`,
          numberOfItems: sortedProjects.length,
          itemListElement: sortedProjects.map((p, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            url: `${baseUrl}/du-an/${p.slug}`,
            name: p.title,
            image: p.images?.[0] || "",
          })),
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
