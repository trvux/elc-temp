import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import { ProjectTypeWithCategories } from "@/modules/project-type/domain/types";
import { getProjectsAction, getCategoriesByProjectTypeIdAction } from "@/modules/project/presentation/actions";
import { ProjectCard } from "@/modules/project/presentation/components/ProjectCard";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { FilteredGridWrapper } from "@/shared/components/layout/user/filtered-grid-wrapper";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { PageHero } from "@/shared/components/sections/page-hero";
import { Button } from "@/shared/components/ui/button";
import { TypographySmall } from "@/shared/components/ui/typography";
import { getQueryTokens } from "@/shared/lib/search-utils";
import { BASE_URL } from "@/shared/lib/seo-schema";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectFilterMobile } from "./ProjectFilterMobile";
import { ProjectFilters } from "./ProjectFilters";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { primaryImageUrl } from "@/shared/lib/image-asset";

interface ProjectListModuleProps {
  projectType?: ProjectTypeWithCategories | null;
  searchParams: { [key: string]: string | string[] | undefined };
}

const STYLES = {
  main: "w-full bg-background min-h-screen",
  container: "mx-auto w-full max-w-350 flex flex-col",
  header: "flex flex-col items-center text-center gap-4 max-w-4xl mx-auto",
  badgeWrapper: "flex items-center gap-2 mt-2",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12 min-h-[450px] content-start animate-fade-in-up",
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
  serviceSlugs: string[],
  searchVal: string | undefined,
  conditionParam: string | undefined,
) {
  // Only fetch all published projects separately when filters are active (avoid duplicate query)
  const hasFilters = !!(projectType?.id || categorySlugs.length > 0 || serviceSlugs.length > 0 || searchVal);

  const [
    projectsRaw,
    allProjectTypes,
    allPublishedProjectsRawOrNull,
    allServices,
    projectTypeCategoriesRaw,
    allCategoriesRaw,
  ] = await Promise.all([
    getProjectsAction({
      isPublished: true,
      projectTypeId: projectType?.id || undefined,
      categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
      serviceSlugs: serviceSlugs.length > 0 ? serviceSlugs : undefined,
      search: searchVal,
    }).then(unwrapActionResult),
    getProjectTypesAction().then(unwrapActionResult),
    hasFilters ? getProjectsAction({ isPublished: true }).then(unwrapActionResult) : Promise.resolve(null),
    getServicesAction({ isPublished: true }).then(unwrapActionResult),
    projectType
      ? getCategoriesByProjectTypeIdAction(projectType.id).then(unwrapActionResult)
      : Promise.resolve(null),
    projectType
      ? Promise.resolve([])
      : getCategoriesAction({ includeDeleted: false }).then(unwrapActionResult),
  ]);

  // Reuse projectsRaw when no filters are active (same query, no need to duplicate)
  const allPublishedProjectsRaw = allPublishedProjectsRawOrNull ?? projectsRaw;

  let projects = projectsRaw;

  if (conditionParam) {
    projects = projects.filter((p) =>
      p.categories?.some((c) => c.condition === conditionParam),
    );
  }

  // Sort projects: featured first, then order index
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.orderIndex - b.orderIndex;
  });

  const activeProjectTypes = allProjectTypes.filter((st) => !st.deletedAt);

  const allPublishedProjects = conditionParam
    ? allPublishedProjectsRaw.filter((p) =>
        p.categories?.some((c) => c.condition === conditionParam),
      )
    : allPublishedProjectsRaw;

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

    // 2. Merge default categories with project-specific ones from the repository
    const categoryMap = new Map<
      string,
      { id: string; name: string; slug: string }
    >();

    // Add default ones first
    defaultCategories.forEach((cat) => {
      categoryMap.set(cat.id, cat);
    });

    // Add project-specific ones fetched from the repo
    if (projectTypeCategoriesRaw) {
      projectTypeCategoriesRaw.forEach((cat) => {
        categoryMap.set(cat.id, cat);
      });
    }

    filterCategories = Array.from(categoryMap.values()).map((cat) => {
      // For category counts, we only count projects within the current projectType
      const count = allPublishedProjects.filter(
        (p) =>
          p.projectTypeId === projectType.id &&
          p.categories?.some((c) => c.id === cat.id),
      ).length;
      return { ...cat, count };
    });
  } else {
    filterCategories = allCategoriesRaw.map((cat) => {
      const count = allPublishedProjects.filter((p) =>
        p.categories?.some((c) => c.id === cat.id),
      ).length;
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug || "",
        count,
      };
    });
  }

  // 4. Fetch services for filtering
  const serviceItems = allServices.map((svc) => {
    const count = allPublishedProjects.filter((p) => {
      const matchProjectType = projectType
        ? p.projectTypeId === projectType.id
        : true;
      const matchService = p.services?.some((s) => s.id === svc.id);
      return matchProjectType && matchService;
    }).length;
    return {
      id: svc.id,
      name: svc.title,
      slug: svc.slug || "",
      count,
    };
  });

  return {
    sortedProjects,
    projectTypeItems,
    filterCategories,
    serviceItems,
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
  const serviceParam = searchParams.service;
  const serviceSlugs =
    typeof serviceParam === "string"
      ? serviceParam.split(",").filter(Boolean)
      : Array.isArray(serviceParam)
        ? serviceParam
        : [];
  const searchVal =
    typeof searchParams.search === "string"
      ? searchParams.search.trim()
      : undefined;

  const conditionVal =
    typeof searchParams.condition === "string"
      ? searchParams.condition
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

  let cachedData: Awaited<ReturnType<typeof getCachedProjectListData>>;
  try {
    cachedData = await getCachedProjectListData(
      projectTypeData,
      categorySlugs,
      serviceSlugs,
      searchVal,
      conditionVal,
    );
  } catch (err) {
    console.error("[ProjectListModule] Failed to load project data:", err);
    cachedData = {
      sortedProjects: [],
      projectTypeItems: [],
      filterCategories: [],
      serviceItems: [],
      currentYear: new Date().getFullYear(),
    };
  }

  const {
    sortedProjects,
    projectTypeItems,
    filterCategories,
    serviceItems,
    currentYear,
  } = cachedData;

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
        <PageHero
          className={STYLES.header}
          title={pageTitle}
          description={pageSubtitle}
        >
          {/* Project Type Representative Image - Hidden if null */}
          {projectType && projectType.image && (
            <div className="w-full max-w-4xl mt-6 overflow-hidden rounded-md border border-border/40 shadow-sm animate-fade-in-up">
              <AspectRatio ratio={21 / 9}>
                <Image
                  src={projectType.image}
                  alt={projectType.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
              </AspectRatio>
            </div>
          )}
        </PageHero>
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
            <Suspense fallback={null}>
              <ProjectFilters
                projectTypes={projectTypeItems}
                currentProjectTypeSlug={projectType?.slug || ""}
                categories={filterCategories}
                currentCategorySlugs={categorySlugs}
                services={serviceItems}
                currentServiceSlugs={serviceSlugs}
                currentCondition={conditionVal}
              />
            </Suspense>
          </aside>

          {/* Project List Area */}
          <div className="flex-1">
            <div className="lg:hidden mb-6 flex justify-end">
              <Suspense fallback={null}>
                <ProjectFilterMobile
                  projectTypes={projectTypeItems}
                  currentProjectTypeSlug={projectType?.slug || ""}
                  categories={filterCategories}
                  currentCategorySlugs={categorySlugs}
                  services={serviceItems}
                  currentServiceSlugs={serviceSlugs}
                  currentCondition={conditionVal}
                />
              </Suspense>
            </div>
            <FilteredGridWrapper fallback={null}>
              {sortedProjects.length > 0 ? (
                <div className={STYLES.grid}>
                  {sortedProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      queryTokens={queryTokens}
                      priority={index < 6}
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
                      href={
                        projectType ? `/du-an/${projectType.slug}` : "/du-an"
                      }
                    >
                      Xóa tất cả bộ lọc
                    </Link>
                  </Button>
                </div>
              )}
            </FilteredGridWrapper>
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
            &copy; {currentYear} Điện máy ELC.
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
        const baseUrl = BASE_URL;
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
            image: primaryImageUrl(p.images),
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
