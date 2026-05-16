import { getProjects } from "@/modules/project";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  TypographyH1,
  TypographyLead,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function ProjectsPage() {
  const projects = await getProjects({ isPublished: true });
  const allProjects = [...projects].sort((a, b) => {
    if (a.isFeatured === b.isFeatured) return 0;
    return a.isFeatured ? -1 : 1;
  });

  const getUrl = (p: any) => `/du-an/${p.slug}`;
  const getCat = (p: any) => p.category?.name || "Dự án";

  return (
    <main className="w-full px-4 py-20 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col items-center text-center gap-6 max-w-2xl w-full mx-auto mb-20">
          <TypographyH1 className="tracking-tight">Dự án</TypographyH1>
          <TypographyLead>
            Tổng hợp các công trình tiêu biểu do đội ngũ ELC trực tiếp tư vấn,
            thiết kế và thi công lắp đặt.
          </TypographyLead>
        </header>

        {allProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {allProjects.map((project, index) => {
              const url = getUrl(project);
              const cat = getCat(project);
              const isFeatured = project.isFeatured;

              return (
                <Card
                  key={project.id}
                  className="relative mx-auto w-full pt-0 flex flex-col group overflow-hidden border-none shadow-none ring-1 ring-foreground/10"
                >
                  <div className="relative overflow-hidden">
                    <AspectRatio ratio={16 / 9}>
                      <div className="absolute inset-0 z-10 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {project.images?.[0] ? (
                        <Image
                          src={project.images[0]}
                          alt={project.title}
                          fill
                          className="relative z-0 object-cover transition-transform duration-1000 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
                          priority={index < 4}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] tracking-widest uppercase text-muted-foreground/40 bg-muted">
                          Chưa có ảnh
                        </div>
                      )}
                    </AspectRatio>
                  </div>

                  <CardHeader className="flex-1">
                    <CardAction>
                      {isFeatured ? (
                        <Badge
                          variant="secondary"
                          className="text-amber-600 bg-amber-50"
                        >
                          <Sparkles
                            data-icon="inline-start"
                            className="text-amber-600 bg-amber-50"
                          />
                          Tiêu biểu
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{cat}</Badge>
                      )}
                    </CardAction>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Dự án hoàn thiện tại khu vực {cat}. ELC mang đến giải pháp
                      hệ thống điều hòa và lọc không khí tối ưu.
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="mt-auto">
                    <Link href={url} className="w-full">
                      <Button className="w-full">Xem chi tiết</Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-32 text-center">
            <TypographyMuted className="italic opacity-40">
              Hiện chưa có dự án nào được cập nhật.
            </TypographyMuted>
          </div>
        )}
      </div>
    </main>
  );
}
