import { AnimateIn } from "@/shared/components/ui/animate-in";
import { Badge } from "@/shared/components/ui/badge";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { getOptimizedImage } from "@/shared/lib/image";
import Image from "next/image";
import Link from "next/link";

import { ProjectWithCategory as Project } from "@/modules/project/domain";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Sparkle } from "lucide-react";

interface ShowcaseSectionProps {
  projects: Project[];
}

export function ShowcaseSection({ projects }: ShowcaseSectionProps) {
  const featuredProjects = projects?.filter((p) => p.isFeatured) || [];

  if (featuredProjects.length === 0) return null;

  const getProjectUrl = (p: Project) => {
    return `/du-an/${p.slug}`;
  };

  const ProjectMolecule = ({
    project,
    priority,
  }: {
    project: Project;
    priority?: boolean;
  }) => (
    <Link
      href={getProjectUrl(project)}
      className="group block transition-all duration-300"
    >
      <Card className="relative overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-md group/card">
        {/* Background Pattern: Diagonal Stripes */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[repeating-linear-gradient(45deg,currentColor,currentColor_2px,transparent_4px,transparent_24px)]" />
        <CardContent className="relative">
          <div className="flex items-center gap-4 md:gap-12">
            {/* Left: Image */}
            <div className="w-32 md:w-56 lg:w-80 shrink-0">
              <div className="relative aspect-video overflow-hidden rounded-sm bg-muted">
                {project.images?.[0] ? (
                  <Image
                    src={getOptimizedImage(project.images[0], 800)}
                    alt={project.title}
                    fill
                    className="object-cover border border-border p-2 bg-muted"
                    sizes="(max-width: 768px) 128px, (max-width: 1200px) 224px, 320px"
                    priority={priority}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TypographyMuted>No Image</TypographyMuted>
                  </div>
                )}
              </div>
            </div>
            {/* Middle: Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-1 md:gap-2 items-start">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <Sparkle
                    data-icon="inline-start"
                    className="fill-foreground text-foreground "
                  />
                  Nổi bật
                </Badge>
                {project.category && (
                  <Badge variant="secondary" className="max-w-full truncate">
                    Danh mục{" "}
                    {project.category.parent?.name
                      ? `${project.category.parent.name} / `
                      : ""}
                    {project.category.name}
                  </Badge>
                )}
              </div>

              <TypographyLarge className="line-clamp-2 w-full">
                {project.title}
              </TypographyLarge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <section>
      <AnimateIn>
        <TypographyH1 className="mb-10 text-center">Dự án</TypographyH1>
      </AnimateIn>

      <div className="flex flex-col gap-6 md:gap-10">
        {featuredProjects.map((p, idx) => (
          <ProjectMolecule key={p.id} project={p} priority={idx < 2} />
        ))}
      </div>
    </section>
  );
}
