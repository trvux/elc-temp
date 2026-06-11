"use client";

import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import {
  TypographyH1,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ProjectWithCategory as Project } from "@/modules/project/domain";
import { ProjectCard } from "@/modules/project/presentation/components/ProjectCard";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ArrowUpRight } from "@phosphor-icons/react";

interface ShowcaseSectionProps {
  projects: Project[];
}

export function ShowcaseSection({ projects }: ShowcaseSectionProps) {
  const featuredProjects = useMemo(
    () => projects?.filter((p) => p.isFeatured) || [],
    [projects],
  );

  const projectTypes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug?: string }>();
    featuredProjects.forEach((p) => {
      if (p.projectType) {
        map.set(p.projectType.id, p.projectType);
      }
    });
    return Array.from(map.values());
  }, [featuredProjects]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const firstType = projectTypes[0];
    return firstType ? firstType.id : "all";
  });

  // Keep state in sync if projectTypes load dynamically or change
  const currentActiveTab = useMemo(() => {
    if (activeTab === "all" && projectTypes[0]) {
      return projectTypes[0].id;
    }
    return activeTab;
  }, [activeTab, projectTypes]);

  const filteredProjects = useMemo(() => {
    return featuredProjects
      .filter((p) => p.projectType?.id === currentActiveTab)
      .slice(0, 6);
  }, [featuredProjects, currentActiveTab]);

  if (featuredProjects.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      <StaggerContainer
        className="flex flex-col gap-2 md:gap-4 w-full"
        amount={0.1}
        immediate
      >
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

        {projectTypes.length > 0 && (
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
                    {projectTypes.map((st) => (
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
      </StaggerContainer>

      <div className="w-full min-h-[300px]" key={activeTab}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full justify-items-center">
          {filteredProjects.map((p, index) => (
            <AnimateIn
              key={p.id}
              className="w-full flex justify-center"
              delay={(index % 3) * 0.1}
            >
              <ProjectCard project={p} />
            </AnimateIn>
          ))}
          {filteredProjects.length === 0 && (
            <AnimateIn className="w-full py-16 text-center border border-dashed border-border/10 rounded-xl bg-background/25">
              <TypographyMuted>
                Chưa có dự án nào trong không gian này
              </TypographyMuted>
            </AnimateIn>
          )}
        </div>
      </div>
    </div>
  );
}
