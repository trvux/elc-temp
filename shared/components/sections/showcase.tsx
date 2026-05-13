import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { Badge } from "@/shared/components/ui/badge";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import { getOptimizedImage } from "@/shared/lib/image";
import Image from "next/image";
import Link from "next/link";

import { ProjectWithCategory as Project } from "@/modules/project/domain";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ArrowUpRight, Sparkle } from "lucide-react";

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
      <StaggerContainer className="flex flex-col gap-6 md:gap-10">
        <div className="flex flex-col items-center text-center gap-3 mb-4 md:mb-10">
          <StaggerItem>
            <TypographyH1>
              <Link
                href="/du-an"
                className="group relative inline-flex items-center justify-center hover:text-blue-700 transition-colors"
              >
                Dự án
                <ArrowUpRight className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-8 md:w-8 transition-all duration-300 group-hover:-translate-y-6 group-hover:translate-x-6" />
              </Link>
            </TypographyH1>
          </StaggerItem>
          <StaggerItem>
            <TypographyP className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá các dự án tiêu biểu mà chúng tôi đã thực hiện, mang lại
              giải pháp tối ưu cho không gian sống và làm việc.
            </TypographyP>
          </StaggerItem>
        </div>

        {featuredProjects.map((p, idx) => (
          <StaggerItem key={p.id}>
            <ProjectMolecule project={p} priority={idx < 2} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
