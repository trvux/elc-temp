import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  images: string[];
  categories?: { name: string };
}

interface ShowcaseSectionProps {
  projects: Project[];
}

export function ShowcaseSection({ projects }: ShowcaseSectionProps) {
  // Use first project as main featured, others as list
  const mainProject = projects?.[0];
  const otherProjects = projects?.slice(1);

  if (!mainProject) return null;

  return (
    <section className="relative w-full flex-1 flex flex-col justify-center pt-section pb-20 sm:pb-28 lg:pb-44 overflow-hidden">
      <div className="px-container max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-fluid items-center">
          {/* Main Visual - Left side */}
          <div className="w-full lg:w-1/2 order-1 relative flex justify-center lg:justify-end pr-0 lg:pr-12">
            <div className="w-full max-w-md relative">
              <div className="absolute -inset-4 bg-muted rounded-[2rem] -z-10" />
              <Link
                href={`/cong-trinh/${mainProject.slug}`}
                className="block w-full"
              >
                <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden group cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-[1.5s]">
                  {mainProject.images?.[0] && (
                    <Image
                      src={mainProject.images[0]}
                      alt={mainProject.title}
                      fill
                      className="object-cover transition-transform duration-[2s] group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Subtle Hover Action */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700 z-10 flex flex-col items-center gap-4">
                    <div className="bg-card/90 backdrop-blur-md text-card-foreground h-20 w-20 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-700 shadow-2xl">
                      <ArrowUpRight className="h-8 w-8 stroke-[1px]" />
                    </div>
                  </div>

                  {/* Bottom label on hover */}
                  <div className="absolute bottom-8 left-8 right-8 text-primary-foreground translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 z-10">
                    <p className="text-sm font-medium tracking-wide">
                      Xem chi tiết
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Typography & Context - Right side */}
          <div className="w-full lg:w-1/2 order-2 flex flex-col justify-center relative animate-in fade-in slide-in-from-bottom-8 duration-[1.5s] delay-300">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-4 mb-10">
                <Badge
                  variant="outline"
                  className="text-[10px] capitalize tracking-[0.25em] font-medium px-3 py-1 h-auto rounded-full border-border/50"
                >
                  01 ━ Dự án nổi bật
                </Badge>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter mb-8 leading-[1.05] text-foreground">
                <span className="block italic text-muted-foreground/80">
                  {mainProject.title.split(" ")[0]}
                </span>
                <span className="block">
                  {mainProject.title.split(" ").slice(1).join(" ")}
                </span>
              </h2>

              <p className="text-sm md:text-base text-muted-foreground mb-12 leading-relaxed font-light line-clamp-4 max-w-md">
                {mainProject.description?.replace(/<[^>]*>?/gm, "")}
              </p>

              <div className="grid grid-cols-2 gap-8 mb-16 max-w-sm">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] capitalize tracking-[0.2em] font-medium text-muted-foreground">
                    Danh mục
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {mainProject.categories?.name || "Kiến trúc"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] capitalize tracking-[0.2em] font-medium text-muted-foreground">
                    Năm
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    2026
                  </span>
                </div>
              </div>

              {/* Other Projects List */}
              {otherProjects && otherProjects.length > 0 && (
                <div className="opacity-80 hover:opacity-100 transition-opacity">
                  <Separator className="mb-6" />
                  <div className="flex flex-col gap-1">
                    {otherProjects.slice(0, 2).map((p, idx) => (
                      <Link
                        key={p.id}
                        href={`/cong-trinh/${p.slug}`}
                        className="group flex items-center justify-between py-3 hover:pl-4 transition-all duration-300"
                      >
                        <div className="flex items-center gap-5">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            0{idx + 2}
                          </span>
                          <span className="text-sm md:text-base font-light text-foreground group-hover:italic transition-all capitalize tracking-wide">
                            {p.title}
                          </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
