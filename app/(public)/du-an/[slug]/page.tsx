import { getAdjacentProjects } from "@/modules/project/application/getAdjacentProjects";
import { getProjects } from "@/modules/project/application/getProjects";
import { resolveProjectPath } from "@/modules/project/application/resolveProjectPath";
import { ProjectWithCategory } from "@/modules/project/domain/types";
import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";
import { RelatedProjects } from "@/modules/project/presentation/components/public/RelatedProjects";
import { getProjectTypes } from "@/modules/project-type/application";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { DetailPager } from "@/shared/components/layout/user/detail-pager";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { TypographySmall } from "@/shared/components/ui/typography";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

// Generate dynamic SEO Metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await resolveProjectPath(slug);

  if (!entity) {
    return {
      title: "Không tìm thấy trang | ELC",
    };
  }

  if (entity.type === "project_type") {
    const st = entity.data;
    return {
      title: `${st.metaTitle || `Dự án ${st.name}`} | Điện máy ELC`,
      description:
        st.metaDescription ||
        `Tổng hợp các dự án, công trình thiết kế thi công hệ thống, điều hòa không khí cho ${st.name} tiêu biểu do ELC thực hiện.`,
    };
  }

  if (entity.type === "project") {
    const proj = entity.data;
    return {
      title: `${proj.metaTitle || proj.title} | Điện máy ELC`,
      description:
        proj.metaDescription ||
        `Chi tiết công trình ${proj.title} hoàn thiện lắp đặt hệ thống chuyên nghiệp bởi ELC.`,
    };
  }

  return {};
}

// Generate static parameters for high performance static pre-rendering
export async function generateStaticParams() {
  const projectTypes = await getProjectTypes();
  const projects = await getProjects({ isPublished: true });

  const projectTypeParams = projectTypes
    .filter((st) => st.slug && !st.deletedAt)
    .map((st) => ({
      slug: st.slug,
    }));

  const projectParams = projects
    .filter((p) => p.slug && !p.deletedAt)
    .map((p) => ({
      slug: p.slug,
    }));

  const params = [...projectTypeParams, ...projectParams];
  if (params.length === 0) {
    return [{ slug: "preview-stub" }];
  }
  return params;
}

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
  const entity = await resolveProjectPath(slug);

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
async function ProjectDetailView({ project }: { project: ProjectWithCategory }) {
  const images = project.images || [];
  const displayCategory =
    project.categories?.[0]?.name || project.projectType?.name || "Dự án";

  const currentYear = await getCachedCurrentYear();
  const { prev, next } = await getAdjacentProjects(project);

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

  return (
    <main className="w-full bg-background min-h-screen flex flex-col">
      {/* ===== KHỐI 1: NỘI DUNG BÀI VIẾT ===== */}
      <GridSection
        id="project-detail-content"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in-up">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            {project.title}
          </h1>

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
                <Image
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
                      <Image
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
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản quyền.
          </TypographySmall>
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
