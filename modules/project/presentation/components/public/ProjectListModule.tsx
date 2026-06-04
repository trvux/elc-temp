import { getCategoriesNew } from "@/modules/category-new/application";
import { getProjects } from "@/modules/project/application/getProjects";
import { ProjectCard } from "@/modules/project/presentation/components/ProjectCard";
import { getProjectTypes } from "@/modules/project-type/application";
import { ProjectTypeWithCategories } from "@/modules/project-type/domain/types";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { Button } from "@/shared/components/ui/button";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { getQueryTokens } from "@/shared/lib/search-utils";
import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectFilterMobile } from "./ProjectFilterMobile";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectSearchInput } from "./ProjectSearchInput";

interface ProjectListModuleProps {
  projectType?: ProjectTypeWithCategories | null;
  searchParams: { [key: string]: string | string[] | undefined };
}

const STYLES = {
  main: "w-full bg-background min-h-screen",
  container: "mx-auto w-full max-w-350 flex flex-col",
  header: "flex flex-col items-center text-center gap-4 max-w-4xl mx-auto",
  badgeWrapper: "flex items-center gap-2 mt-2",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12 min-h-[450px] animate-fade-in-up",
  emptyState:
    "py-24 text-center border border-dashed border-border rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-4 max-w-lg mx-auto w-full min-h-[300px] animate-fade-in-up",
  emptyText: "text-muted-foreground italic text-sm",
  footer:
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  scrollToTop:
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
};

interface CachedProjectType {
  id: string;
  name: string;
  slug: string;
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

async function getCachedProjectListData(
  projectType: CachedProjectType | null,
  categorySlugs: string[],
  searchVal: string | undefined,
) {
  "use cache";
  // Serve stale content for up to 1 hour while revalidating in background every 5 minutes.
  // This prevents blank page caused by cache cold-start race condition.
  cacheLife({ stale: 3600, revalidate: 300, expire: 86400 });
  setUseStaticClient(true);

  // 1. Fetch filtered projects
  const projects = await getProjects({
    isPublished: true,
    projectTypeId: projectType?.id || undefined,
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
  const allProjectTypes = await getProjectTypes();
  const activeProjectTypes = allProjectTypes.filter((st) => !st.deletedAt);

  // Fetch all published projects to compute counts
  const allPublishedProjects = await getProjects({ isPublished: true });

  const projectTypeItems = activeProjectTypes.map((st) => {
    const count = allPublishedProjects.filter(
      (p) => p.projectTypeId === st.id,
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
  if (projectType) {
    // 1. Get default categories defined on the service type
    const defaultCategories = (projectType.categories || []).map((cat) => ({
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
        projects!inner(id, project_type_id, is_published, deleted_at)
      `,
      )
      .eq("projects.project_type_id", projectType.id)
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
          project_type_id: string | null;
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
      // For category counts, we only count projects within the current projectType
      const count = allPublishedProjects.filter(
        (p) =>
          p.projectTypeId === projectType.id &&
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

  return {
    sortedProjects,
    projectTypeItems,
    filterCategories,
    currentYear: new Date().getFullYear(),
  };
}

export async function ProjectListModule({
  projectType = null,
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

  const queryTokens = getQueryTokens(searchVal || "");

  // Prepare simplified projectType for cache helper parameters
  const projectTypeData: CachedProjectType | null = projectType
    ? {
        id: projectType.id,
        name: projectType.name,
        slug: projectType.slug,
        categories: (projectType.categories || []).map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug || "",
        })),
      }
    : null;

  const { sortedProjects, projectTypeItems, filterCategories, currentYear } =
    await getCachedProjectListData(projectTypeData, categorySlugs, searchVal);

  // Breadcrumbs items
  const breadcrumbItems = [
    {
      label: "Dự án",
      href: projectType ? "/du-an" : undefined,
      active: !projectType,
    },
    ...(projectType ? [{ label: projectType.name, active: true }] : []),
  ];

  // Dynamic header text
  const pageTitle = searchVal
    ? `Kết quả tìm kiếm cho "${searchVal}"`
    : projectType
      ? `Dự án — ${projectType.name}`
      : "Các công trình dự án ELC đã thực hiện";

  const pageSubtitle = projectType
    ? `Các công trình thiết kế và thi công hệ thống, điều hòa không khí trong không gian kiến trúc ${projectType.name} do ELC thực hiện.`
    : "Tổng hợp các công trình tiêu biểu do đội ngũ ELC trực tiếp tư vấn, thiết kế và thi công lắp đặt cho khách hàng toàn quốc.";

  return (
    <main className={STYLES.main}>
      <GridSection
        id="projects-header"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        {/* Hero Header Section */}
        <header className={STYLES.header}>
          <TypographyH1>{pageTitle}</TypographyH1>
          {/* <TypographyLarge className="flex items-center justify-center gap-x-1 text-sm! md:text-md! lg:text-lg! text-muted-foreground mt-2">
              Danh sách{" "}
              <span className="flex gap-x-1 bg-blue-100 text-blue-800 px-2 rounded-sm items-center dark:bg-blue-900/30 dark:text-blue-400 font-semibold">
                {sortedProjects.length} dự án
              </span>{" "}
              đáp ứng tiêu chí
            </TypographyLarge> */}
        </header>
      </GridSection>

      <GridSection
        id="projects-search"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        {/* Filters and Grid Section */}
        <div className="flex flex-col gap-4">
          {/* Mobile view search & filter toggle */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <Suspense fallback={null}>
                <ProjectSearchInput />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <ProjectFilterMobile
                projectTypes={projectTypeItems}
                currentProjectTypeSlug={projectType?.slug || ""}
                categories={filterCategories}
                currentCategorySlugs={categorySlugs}
              />
            </Suspense>
          </div>
        </div>
      </GridSection>

      <GridSection
        id="projects-content"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-28 self-start">
            <Suspense
              fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-muted rounded w-1/2" />
                  <div className="h-40 bg-muted rounded" />
                </div>
              }
            >
              <ProjectFilters
                projectTypes={projectTypeItems}
                currentProjectTypeSlug={projectType?.slug || ""}
                categories={filterCategories}
                currentCategorySlugs={categorySlugs}
              />
            </Suspense>
          </aside>

          {/* Project List Area */}
          <div className="flex-1">
            {sortedProjects.length > 0 ? (
              <div className={STYLES.grid}>
                {sortedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    queryTokens={queryTokens}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className={STYLES.emptyState}>
                <p className={STYLES.emptyText}>
                  Không tìm thấy dự án nào khớp với bộ lọc hoặc tìm kiếm của
                  bạn.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={projectType ? `/du-an/${projectType.slug}` : "/du-an"}
                  >
                    Xóa tất cả bộ lọc
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </GridSection>

      <GridSection
        id="products-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall className="text-xs text-muted-foreground/75">
            &copy; {currentYear} ELC Holdings. Mọi quyền được bảo
            lưu.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      <GridSection
        id="projects-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />
      </GridSection>

      {/* JSON-LD Schema markup for Google Rich Snippets */}
      {(() => {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";
        const schema = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: pageTitle,
          description: pageSubtitle,
          url: projectType
            ? `${baseUrl}/du-an/${projectType.slug}`
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
