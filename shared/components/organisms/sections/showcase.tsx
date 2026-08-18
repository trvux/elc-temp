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
  const allProjects = useMemo(() => projects || [], [projects]);

  const projectTypes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug?: string }>();
    allProjects.forEach((p) => {
      if (p.projectType) {
        map.set(p.projectType.id, p.projectType);
      }
    });
    return Array.from(map.values());
  }, [allProjects]);

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
    return allProjects.filter((p) => p.projectType?.id === currentActiveTab);
  }, [allProjects, currentActiveTab]);

  const TARGET_LENGTH = 12;

  const baseRow = useMemo(() => {
    if (filteredProjects.length === 0) return [];
    const result: Project[] = [];
    while (result.length < TARGET_LENGTH) {
      result.push(...filteredProjects);
    }
    // If very few items, repeat more to guarantee seamless scrolling without white gaps
    if (filteredProjects.length < 4) {
      while (result.length < 24) {
        result.push(...filteredProjects);
      }
    }
    return result;
  }, [filteredProjects]);

  if (allProjects.length === 0) return null;

  const renderMarquee = (items: Project[]) => {
    if (items.length === 0) return null;

    const trackClass =
      "flex shrink-0 justify-around gap-6 animate-marquee-horizontal group-hover:[animation-play-state:paused]";

    // Compute duration based on number of items to keep consistent speed
    const durationSeconds = Math.max(items.length * 10, 30);

    const trackStyle: React.CSSProperties = {
      animationDuration: `${durationSeconds}s`,
    };

    return (
      <div
        className="group flex gap-6 overflow-hidden p-3 w-full mask-[linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
      >
        <div className={trackClass} style={trackStyle}>
          {items.map((project, idx) => (
            <div key={`${project.id}-${idx}`} className="w-80 shrink-0 flex">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
        <div className={trackClass} style={trackStyle}>
          {items.map((project, idx) => (
            <div key={`${project.id}-${idx}-dup1`} className="w-80 shrink-0 flex">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
        <div className={trackClass} style={trackStyle}>
          {items.map((project, idx) => (
            <div key={`${project.id}-${idx}-dup2`} className="w-80 shrink-0 flex">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    );
  };

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

      <div className="w-full min-h-75 flex items-center" key={activeTab}>
        {filteredProjects.length > 0 ? (
          renderMarquee(baseRow)
        ) : (
          <AnimateIn className="w-full py-16 text-center border border-dashed border-border/10 rounded-xl bg-background/25">
            <TypographyMuted>
              Chưa có dự án nào trong không gian này
            </TypographyMuted>
          </AnimateIn>
        )}
      </div>
    </div>
  );
}
