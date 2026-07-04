import { getAdjacentProjects } from "@/modules/project/application/getAdjacentProjects";
import { projectRepo } from "@/modules/project/infrastructure/projectRepo";
import { resolveProjectPath } from "@/modules/project/application/resolveProjectPath";
import { resolveProjectPathFromDb } from "@/modules/project/infrastructure/resolveProjectPath";
import { ProjectWithCategory } from "@/modules/project/domain/types";
import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";
import { RelatedProjects } from "@/modules/project/presentation/components/public/RelatedProjects";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { DetailPager } from "@/shared/components/layout/user/detail-pager";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { TypographyH1, TypographySmall } from "@/shared/components/ui/typography";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Metadata } from "next";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import { notFound } from "next/navigation";
import { getServiceBySlugAction } from "@/modules/service/presentation/actions";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { 
  generateProjectTypeMetadata, 
  generateProjectDetailMetadata,
  generateProjectDetailSchema
} from "@/shared/lib/seo-utils";
import { getBranches } from "@/modules/branch/application";
import { branchRepo } from "@/modules/branch/infrastructure/branchRepo";

// Generate dynamic SEO Metadata
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await resolveProjectPath(resolveProjectPathFromDb, slug);

  if (!entity) {
    return {
      title: "Không tìm thấy trang | ELC",
    };
  }

  if (entity.type === "project_type") {
    const st = entity.data;
    const resolvedSearchParams = await searchParams;
    
    // Resolve active filter slugs
    const serviceSlug = typeof resolvedSearchParams.service === "string" ? resolvedSearchParams.service : undefined;
    const categorySlug = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : undefined;
    const condition = typeof resolvedSearchParams.condition === "string" ? resolvedSearchParams.condition : undefined;

    let serviceName: string | undefined = undefined;
    let categoryName: string | undefined = undefined;

    if (serviceSlug) {
      const service = await getServiceBySlugAction(serviceSlug);
      if (service) {
        serviceName = service.title;
      }
    }

    if (categorySlug) {
      const supabase = createStaticClient();
      const { data: catData } = await supabase
        .from("categories")
        .select("name")
        .eq("slug", categorySlug)
        .is("deleted_at", null)
        .maybeSingle();
      if (catData) {
        categoryName = catData.name;
      }
    }

    return generateProjectTypeMetadata(
      st,
      { service: serviceSlug, category: categorySlug, condition },
      serviceName,
      categoryName
    );
  }

  if (entity.type === "project") {
    const proj = entity.data;
    return generateProjectDetailMetadata(proj);
  }

  return {};
}

// Generate static parameters for high performance static pre-rendering


interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { slug } = await params;

  // Resolve the slug via the database slug registry
  const entity = await resolveProjectPath(resolveProjectPathFromDb, slug);

  if (!entity) {
    notFound();
  }

  // Branch depending on entity type
  if (entity.type === "project_type") {
    const resolvedSearchParams = await searchParams;
    return (
      <ProjectListModule
        projectType={entity.data}
        searchParams={resolvedSearchParams}
      />
    );
  }

  if (entity.type === "project") {
    return <ProjectDetailView project={entity.data} />;
  }

  notFound();
}

async function getCachedCurrentYear() {
  "use cache";
  return new Date().getFullYear();
}

// Sub-component to render the Project Detail page view
async function ProjectDetailView({
  project,
}: {
  project: ProjectWithCategory;
}) {
  const images = project.images || [];
  const displayCategory =
    project.categories?.[0]?.name || project.projectType?.name || "Dự án";

  const currentYear = await getCachedCurrentYear();
  const { prev, next } = await getAdjacentProjects(projectRepo, project);

  const breadcrumbItems = [
    { label: "Dự án", href: "/du-an" },
    ...(project.projectType
      ? [
          {
            label: project.projectType.name,
            href: project.projectType.slug
              ? `/du-an/${project.projectType.slug}`
              : undefined,
          },
        ]
      : []),
    { label: project.title, active: true },
  ];

  const branches = await getBranches(branchRepo, { isPublished: true });
  const articleSchema = generateProjectDetailSchema(project, branches);

  return (
    <main className="w-full bg-background min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* ===== KHỐI 1: NỘI DUNG BÀI VIẾT ===== */}
      <GridSection
        id="project-detail-content"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in-up">
          {/* Title */}
          <TypographyH1>{project.title}</TypographyH1>

          {/* Badge */}
          <div className="flex items-center">
            <Badge
              variant="outline"
              className="h-8 rounded-md flex items-center gap-1.5 px-3 border-border bg-muted/20"
            >
              <Sparkle className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">
                Danh mục: {displayCategory}
              </span>
            </Badge>
          </div>

          {/* Cover Image */}
          {images[0] && (
            <div className="w-full mt-2 overflow-hidden rounded-sm border border-border/40">
              <AspectRatio ratio={16 / 9}>
                <ImageWithSkeleton
                  wrapperClassName="w-full h-full"
                  src={images[0]}
                  alt={project.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </AspectRatio>
            </div>
          )}

          {/* Article content */}
          <article className="mt-4">
            <PreviewContent
              content={project.description}
              hideFirstHeading={true}
              fallbackAlt={project.title}
            />

            {/* Subsequent gallery images */}
            {images.length > 1 && (
              <div className="mt-12 flex flex-col gap-8">
                {images.slice(1).map((img: string, i: number) => (
                  <div
                    key={i}
                    className="w-full overflow-hidden rounded-sm border border-border/40"
                  >
                    <AspectRatio ratio={3 / 2}>
                      <ImageWithSkeleton
                        wrapperClassName="w-full h-full"
                        src={img}
                        alt={`${project.title} - ảnh ${i + 2}`}
                        fill
                        className="object-contain bg-muted/10"
                        sizes="(max-width: 768px) 100vw, 768px"
                      />
                    </AspectRatio>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </GridSection>

      {/* ===== KHỐI 2: ĐIỀU HƯỚNG DỰ ÁN TRƯỚC / SAU ===== */}
      {(prev || next) && (
        <GridSection
          id="project-detail-pager"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-6 md:py-8 lg:py-10"
        >
          <DetailPager
            prevLabel="Dự án trước"
            nextLabel="Dự án tiếp theo"
            prev={
              prev ? { title: prev.title, href: `/du-an/${prev.slug}` } : null
            }
            next={
              next ? { title: next.title, href: `/du-an/${next.slug}` } : null
            }
          />
        </GridSection>
      )}

      {/* ===== KHỐI 3: DỰ ÁN LIÊN QUAN ===== */}
      <GridSection
        id="project-detail-related"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <RelatedProjects
          projectRepo={projectRepo}
          projectTypeId={project.projectTypeId}
          currentProjectId={project.id}
        />
      </GridSection>

      {/* ===== KHỐI 4: FOOTER BẢN QUYỀN ===== */}
      <GridSection
        id="project-detail-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className="w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      {/* ===== KHỐI 5: BREADCRUMBS ===== */}
      <GridSection
        id="project-detail-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </GridSection>
    </main>
  );
}
