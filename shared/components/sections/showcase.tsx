import { AnimateIn } from "@/shared/components/ui/animate-in";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { getOptimizedImage } from "@/shared/lib/image";
import { cn } from "@/shared/lib/utils";
import { JoinedCategory } from "@/shared/types/database";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProjectWithCategory as Project } from "@/modules/project/domain";

interface ShowcaseSectionProps {
  projects: Project[];
}

export function ShowcaseSection({ projects }: ShowcaseSectionProps) {
  const mainProject = projects?.[0];
  const otherProjects = projects?.slice(1);

  if (!mainProject) return null;

  const getProjectUrl = (p: Project) => {
    return p.category?.slug ? `/du-an/${p.category.slug}/${p.slug}` : `/du-an/${p.slug}`;
  };

  const getMainCategoryLabel = (p: Project) => {
    return p.category?.name || "Kiến trúc";
  };

  const styles = {
    section: "container mx-auto max-w-7xl py-20",
    grid: "grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-x-12 lg:gap-x-16 items-start",
    contentCol: "md:col-span-7 md:col-start-6",
    imageCol: "md:col-span-5 md:row-span-6 md:row-start-1 order-4 md:order-0",
    imageWrapper: "relative overflow-hidden rounded-sm shadow-xl shadow-black/5 w-full aspect-[4/5]",
    image: "object-cover transition-transform duration-1000 group-hover:scale-105",
    relatedCol: "md:col-span-12 lg:col-span-7 lg:col-start-6 order-6",
    relatedTrack: "flex flex-col gap-6",
    relatedItem: "group flex justify-between items-center py-5 border-b border-foreground/30 transition-all",
    arrowIcon: "transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
  };

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {/* Row 1: Category */}
        <AnimateIn className={cn(styles.contentCol, "order-1")}>
          <TypographyMuted>{getMainCategoryLabel(mainProject)}</TypographyMuted>
        </AnimateIn>

        {/* Row 2: Title */}
        <AnimateIn delay={0.1} className={cn(styles.contentCol, "order-2")}>
          <TypographyH1>{mainProject.title}</TypographyH1>
        </AnimateIn>

        {/* Row 3: Description */}
        <AnimateIn delay={0.2} className={cn(styles.contentCol, "order-3")}>
          <TypographyP>
            {typeof mainProject.description === "string" 
              ? mainProject.description.replace(/<[^>]*>/g, "").substring(0, 300) + (mainProject.description.length > 300 ? "..." : "")
              : "Khám phá dự án tiêu biểu của ELC."}
          </TypographyP>
        </AnimateIn>

        {/* Column 1 (Large Image): Spans multiple rows */}
        <div className={styles.imageCol}>
          <AnimateIn variant="fadeIn">
            <Link href={getProjectUrl(mainProject)} className="block group">
              <div className={styles.imageWrapper}>
                {mainProject.images?.[0] && (
                  <Image
                    src={getOptimizedImage(mainProject.images[0], 1200, 75, "cover")}
                    alt={mainProject.title}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, 40vw"
                    priority
                    fetchPriority="high"
                  />
                )}
              </div>
            </Link>
          </AnimateIn>
        </div>

        {/* Row 4: Related Projects */}
        {otherProjects?.length > 0 && (
          <AnimateIn delay={0.3} className={styles.relatedCol}>
            <div className={styles.relatedTrack}>
              <TypographySmall>Dự án liên quan</TypographySmall>
              <div className="flex flex-col">
                {otherProjects.slice(0, 2).map((p, idx) => (
                  <Link
                    key={p.id}
                    href={getProjectUrl(p)}
                    className={styles.relatedItem}
                  >
                    <div className="flex items-center gap-4">
                      <span>0{idx + 2}</span>
                      <TypographyLarge>{p.title}</TypographyLarge>
                    </div>
                    <ArrowUpRight size={16} className={styles.arrowIcon} />
                  </Link>
                ))}
              </div>
            </div>
          </AnimateIn>
        )}
      </div>
    </section>
  );
}
