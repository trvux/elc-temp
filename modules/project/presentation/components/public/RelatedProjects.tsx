import { getProjects } from "@/modules/project/application/getProjects";
import { ProjectCard } from "@/modules/project/presentation/components/ProjectCard";
import { TypographyH2 } from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";

interface RelatedProjectsProps {
  projectTypeId: string | null;
  currentProjectId: string;
  limit?: number;
}

const STYLES = {
  section: cn("w-full"),
  title: cn("mb-10"),
  grid: cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"),
};

/**
 * Khối "Dự án liên quan" trên trang chi tiết — gom các dự án cùng loại công
 * trình (projectType), bỏ dự án hiện tại, ưu tiên nổi bật rồi tới orderIndex.
 */
export async function RelatedProjects({
  projectTypeId,
  currentProjectId,
  limit = 3,
}: RelatedProjectsProps) {
  // Ưu tiên các dự án cùng loại công trình.
  const siblings = await getProjects({
    isPublished: true,
    projectTypeId: projectTypeId || undefined,
  });
  let pool = siblings.filter((p) => p.id !== currentProjectId);

  // Fallback: nếu không có dự án cùng loại, gom toàn bộ dự án đã xuất bản.
  if (pool.length === 0) {
    const all = await getProjects({ isPublished: true });
    pool = all.filter((p) => p.id !== currentProjectId);
  }

  const related = pool
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.orderIndex - b.orderIndex;
    })
    .slice(0, limit);

  if (related.length === 0) return null;

  return (
    <section className={STYLES.section}>
      <TypographyH2 className={STYLES.title}>Dự án liên quan</TypographyH2>
      <div className={STYLES.grid}>
        {related.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
