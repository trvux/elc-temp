"use client";

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
import { useMemo, useState } from "react";

import { ProjectWithCategory as Project } from "@/modules/project/domain";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ArrowUpRight, Sparkle } from "lucide-react";

interface ShowcaseSectionProps {
  projects: Project[];
}

export function ShowcaseSection({ projects }: ShowcaseSectionProps) {
  const featuredProjects = useMemo(
    () => projects?.filter((p) => p.isFeatured) || [],
    [projects],
  );

  const serviceTypes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug?: string }>();
    featuredProjects.forEach((p) => {
      if (p.serviceType) {
        map.set(p.serviceType.id, p.serviceType);
      }
    });
    return Array.from(map.values());
  }, [featuredProjects]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const firstType = serviceTypes[0];
    return firstType ? firstType.id : "all";
  });

  // Keep state in sync if serviceTypes load dynamically or change
  const currentActiveTab = useMemo(() => {
    if (activeTab === "all" && serviceTypes[0]) {
      return serviceTypes[0].id;
    }
    return activeTab;
  }, [activeTab, serviceTypes]);

  const filteredProjects = useMemo(() => {
    return featuredProjects
      .filter((p) => p.serviceType?.id === currentActiveTab)
      .slice(0, 6);
  }, [featuredProjects, currentActiveTab]);

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
      className="group block transition-all duration-300 w-full"
    >
      <Card className="relative overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-md group/card bg-background border-border/10">
        {/* Background Pattern: Diagonal Stripes */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[repeating-linear-gradient(45deg,currentColor,currentColor_2px,transparent_4px,transparent_24px)]" />
        <CardContent className="relative py-6">
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

              <TypographyLarge className="line-clamp-2 w-full text-foreground">
                {project.title}
              </TypographyLarge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <Card className="w-full bg-card-foreground text-white py-16 px-4 md:px-8 flex flex-col items-center justify-center gap-6 shadow-sm border overflow-hidden">
      <StaggerContainer className="flex flex-col gap-2 md:gap-4 w-full">
        <div className="flex flex-col items-center text-center gap-3 mb-4 md:mb-10">
          <StaggerItem>
            <TypographyH1>
              <Link
                href="/du-an"
                className="group relative inline-flex items-center justify-center transition-colors"
              >
                Dự án & công trình đã thực hiện
                <ArrowUpRight className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-8 md:w-8 transition-all duration-300 group-hover:-translate-y-2 group-hover:translate-x-2" />
              </Link>
            </TypographyH1>
          </StaggerItem>
          <StaggerItem>
            <TypographyP className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá các công trình tiêu biểu mà chúng tôi đã thực hiện, mang
              lại giải pháp tối ưu cho không gian sống và làm việc.
            </TypographyP>
          </StaggerItem>
        </div>

        {serviceTypes.length > 0 && (
          <StaggerItem className="w-full flex justify-center">
            <Tabs
              value={currentActiveTab}
              onValueChange={setActiveTab}
              className="w-full flex flex-col items-center gap-6"
            >
              <ScrollArea className="w-full no-scrollbar flex justify-center">
                <div className="min-w-full flex justify-start md:justify-center pb-1">
                  <TabsList className="flex flex-row flex-nowrap justify-start w-max md:w-fit">
                    {/* <TabsTrigger value="all" className="shrink-0 px-4 py-1.5 md:px-5 md:py-2">
                      Tất cả
                    </TabsTrigger> */}
                    {serviceTypes.map((st) => (
                      <TabsTrigger
                        key={st.id}
                        value={st.id}
                        className="shrink-0 px-4 py-1.5 md:px-5 md:py-2"
                      >
                        {st.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </ScrollArea>
            </Tabs>
          </StaggerItem>
        )}

        <div className="w-full min-h-[300px]" key={activeTab}>
          <StaggerContainer className="flex flex-col gap-4 w-full">
            {filteredProjects.map((p, idx) => (
              <StaggerItem key={p.id} className="w-full">
                <ProjectMolecule project={p} priority={idx < 2} />
              </StaggerItem>
            ))}
            {filteredProjects.length === 0 && (
              <StaggerItem className="w-full py-16 text-center border border-dashed border-border/10 rounded-xl bg-background/25">
                <TypographyMuted>
                  Chưa có dự án nào trong không gian này
                </TypographyMuted>
              </StaggerItem>
            )}
          </StaggerContainer>
        </div>
      </StaggerContainer>
    </Card>
  );
}
