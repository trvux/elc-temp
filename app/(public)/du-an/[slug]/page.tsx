import { TrackView } from "@/modules/event";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import { getAdjacentProjectsAction } from "@/modules/project/presentation/actions";
import { resolveProjectPathFromDb } from "@/modules/project/presentation/resolveProjectPath";
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
import { getCategoryBySlugAction } from "@/modules/category/presentation/actions";
import {
  generateProjectTypeMetadata, 
  generateProjectDetailMetadata,
  generateProjectDetailSchema
} from "@/shared/lib/seo-utils";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { unwrapActionResult } from "@/shared/lib/action-result";

// Generate dynamic SEO Metadata
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await resolveProjectPathFromDb(slug);

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
      const { data: catData } = await getCategoryBySlugAction(categorySlug);
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
  const entity = await resolveProjectPathFromDb(slug);

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
  const { data: { prev, next } } = await getAdjacentProjectsAction(project.id, project.projectTypeId);

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

  const branches = await getBranchesAction({ isPublished: true }).then(unwrapActionResult);
  const articleSchema = generateProjectDetailSchema(project, branches);

  return (
    <main className="w-full bg-background min-h-screen flex flex-col">
      <TrackView entityType="project" entityId={project.id} entityName={project.title} />
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
                  src={images[0].url}
                  alt={images[0].alt || project.title}
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
              fallbackAlt={project.title}
            />

            {/* Subsequent gallery images */}
            {images.length > 1 && (
              <div className="mt-12 flex flex-col gap-8">
                {images.slice(1).map((img, i) => (
                  <div
                    key={i}
                    className="w-full overflow-hidden rounded-sm border border-border/40"
                  >
                    <AspectRatio ratio={3 / 2}>
                      <ImageWithSkeleton
                        wrapperClassName="w-full h-full"
                        src={img.url}
                        alt={img.alt || `${project.title} - ảnh ${i + 2}`}
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

          {/* CTA placed after the case study content, not before it — by
              this point the visitor has seen the finished work and is the
              most likely to want something similar, not before they've read
              anything. */}
          <div className="mt-4 pt-6 border-t border-border/40">
            <LeadForm
              projectId={project.id}
              entityName={project.title}
              entityKind="project"
              triggerLabel="Yêu cầu tư vấn dự án tương tự"
            />
          </div>
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
