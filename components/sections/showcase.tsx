import { AnimateIn } from "@/components/ui/animate-in";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";
import { getOptimizedImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { JoinedCategory } from "@/types/database";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Project {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  images?: string[] | null;
  categories?: JoinedCategory | JoinedCategory[];
}

interface ShowcaseSectionProps {
  projects: Project[];
}

export function ShowcaseSection({ projects }: ShowcaseSectionProps) {
  const mainProject = projects?.[0];
  const otherProjects = projects?.slice(1);

  if (!mainProject) return null;

  const catData = Array.isArray(mainProject.categories)
    ? mainProject.categories[0]
    : mainProject.categories;

  const mainProjectUrl = catData?.slug
    ? `/cong-trinh/${catData.slug}/${mainProject.slug}`
    : `/cong-trinh/${mainProject.slug}`;

  // Khoảng cách được kiểm soát tập trung tại đây bằng gap
  const LayoutGrid = cn(
    "grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-x-12 lg:gap-x-16 items-start",
  );

  // Ảnh: Chỉ giữ logic vị trí và kích thước cột
  const SectionImage = cn(
    "md:col-span-5 md:row-span-6 md:row-start-1",
    "order-4 md:order-0",
  );

  const ImageWrapper = cn(
    "relative overflow-hidden rounded-sm shadow-xl shadow-black/5",
    "w-full aspect-4/5",
  );

  // Nội dung: Sạch sẽ, không dính margin lẻ
  const SectionCategory = "md:col-span-7 md:col-start-6 order-1";
  const SectionTitle = "md:col-span-7 md:col-start-6 order-2";
  const SectionDescription = "md:col-span-7 md:col-start-6 order-3";
  const SectionRelated = cn(
    "md:col-span-12 lg:col-span-7 lg:col-start-6 order-6",
  );
  return (
    <section className="container mx-auto max-w-7xl">
      <div className={LayoutGrid}>
        {/* 1. Danh mục */}
        <div className={SectionCategory}>
          <TypographyMuted>
            {catData?.parent?.name
              ? `${catData.parent.name} / ${catData.name}`
              : catData?.name || "Kiến trúc"}
          </TypographyMuted>
        </div>

        {/* 2. Title */}
        <div className={SectionTitle}>
          <TypographyH1>{mainProject.title}</TypographyH1>
        </div>

        {/* 3. Bài viết */}
        <div className={SectionDescription}>
          <TypographyP>
            {(mainProject.description || "")
              .replace(/<[^>]*>?/gm, "")
              .slice(0, 300)}
            ...
          </TypographyP>
        </div>

        {/* 4. Ảnh */}
        <div className={SectionImage}>
          <AnimateIn variant="fadeIn">
            <Link href={mainProjectUrl} className="block group">
              <div className={ImageWrapper}>
                {mainProject.images?.[0] && (
                  <Image
                    src={getOptimizedImage(mainProject.images[0])}
                    alt={mainProject.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                )}
              </div>
            </Link>
          </AnimateIn>
        </div>

        {/* 6. Dự án liên quan */}
        {otherProjects?.length > 0 && (
          <div className={SectionRelated}>
            <div className="flex flex-col gap-6">
              {/* Dùng gap bên trong cụm related */}
              <TypographySmall>Dự án liên quan</TypographySmall>
              <div className="flex flex-col">
                {otherProjects.slice(0, 2).map((p, idx) => (
                  <Link
                    key={p.id}
                    href={`/cong-trinh/${p.slug}`}
                    className="group flex justify-between items-center py-5 border-b border-foreground/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span>0{idx + 2}</span>
                      <TypographyLarge>{p.title}</TypographyLarge>
                    </div>
                    <ArrowUpRight size={16} className=" transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
