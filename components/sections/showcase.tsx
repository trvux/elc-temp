import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getOptimizedImage } from "@/lib/image";

interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  images: string[];
  categories?: {
    name: string;
    slug: string;
    parent?: { name: string; slug: string };
  };
}

interface ShowcaseSectionProps {
  projects: Project[];
}

export function ShowcaseSection({ projects }: ShowcaseSectionProps) {
  const mainProject = projects?.[0];
  const otherProjects = projects?.slice(1);

  if (!mainProject) return null;

  const mainProjectUrl = mainProject.categories?.slug
    ? `/cong-trinh/${mainProject.categories.slug}/${mainProject.slug}`
    : `/cong-trinh/${mainProject.slug}`;

  return (
    <section className="">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Cột content — mobile: trên, desktop: phải */}
          <div className="order-1 lg:order-2 flex flex-col gap-6">
            {/* Danh mục */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Danh mục</span>
              <span className="font-medium">
                {mainProject.categories?.parent?.name
                  ? `${mainProject.categories.parent.name} / ${mainProject.categories.name}`
                  : mainProject.categories?.name || "Kiến trúc"}
              </span>
            </div>
            {/* Title */}
            <h2 className="font-newsreader text-3xl md:text-4xl lg:text-5xl leading-tight italic">
              {mainProject.title}
            </h2>

            {/* Description — blur phần cuối */}
            <div className="relative">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-4 lg:line-clamp-20">
                {mainProject.description?.replace(/<[^>]*>?/gm, "")}
              </p>
            </div>
          </div>

          {/* Cột img — mobile: dưới, desktop: trái */}
          <div className="order-2 lg:order-1">
            <Link href={mainProjectUrl}>
              <div className="relative aspect-video lg:aspect-[3/4] overflow-hidden rounded-2xl group">
                {mainProject.images?.[0] && (
                  <Image
                    src={getOptimizedImage(mainProject.images[0])}
                    alt={mainProject.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white rounded-full p-3">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Bài gợi ý — dưới cùng */}
        {otherProjects && otherProjects.length > 0 && (
          <div className="mt-12">
            <Separator className="mb-6" />
            <div className="flex flex-col gap-4">
              {otherProjects.slice(0, 2).map((p, idx) => {
                const projectUrl = p.categories?.slug
                  ? `/cong-trinh/${p.categories.slug}/${p.slug}`
                  : `/cong-trinh/${p.slug}`;
                return (
                  <Link
                    key={p.id}
                    href={projectUrl}
                    className="flex items-center justify-between py-3 border-b border-border/50 hover:border-border transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground font-mono">
                        0{idx + 2}
                      </span>
                      <span className="text-sm md:text-base font-medium group-hover:text-foreground transition-colors">
                        {p.title}
                      </span>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="text-muted-foreground group-hover:text-foreground transition-colors"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
