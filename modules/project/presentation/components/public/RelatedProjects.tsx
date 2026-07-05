import { getProjectsAction } from "@/modules/project/presentation/actions";
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
 * Khoi "Du an lien quan" tren trang chi tiet — gom cac du an cung loai cong
 * trinh (projectType), bo du an hien tai, uu tien noi bat roi toi orderIndex.
 */
export async function RelatedProjects({
  projectTypeId,
  currentProjectId,
  limit = 3,
}: RelatedProjectsProps) {
  // Uu tien cac du an cung loai cong trinh.
  const { data: siblings } = await getProjectsAction({
    isPublished: true,
    projectTypeId: projectTypeId || undefined,
  });
  let pool = siblings.filter((p) => p.id !== currentProjectId);

  // Fallback: neu khong co du an cung loai, gom toan bo du an da xuat ban.
  if (pool.length === 0) {
    const { data: all } = await getProjectsAction({ isPublished: true });
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
      <TypographyH2 className={STYLES.title}>Du an lien quan</TypographyH2>
      <div className={STYLES.grid}>
        {related.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
