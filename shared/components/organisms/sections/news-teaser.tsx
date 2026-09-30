import Image from "next/image";
import Link from "next/link";

import type { News } from "@/modules/news/domain";
import { Button } from "@/shared/components/ui/button";
import { TypographyH2 } from "@/shared/components/ui/typography";
import { primaryImageUrl } from "@/shared/lib/image-asset";

interface NewsTeaserSectionProps {
  news: News[];
}

// Homepage hub teaser into the /tin-tuc vertical — card markup mirrors the
// "Bài viết liên quan" block on the news detail page
// (app/(public)/tin-tuc/[slug]/page.tsx) so the same article-card look is
// consistent everywhere it appears on the site.
export function NewsTeaserSection({ news }: NewsTeaserSectionProps) {
  if (news.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <Button asChild variant="link">
        <Link
          href="/tin-tuc"
          className="group relative inline-flex items-center justify-center transition-colors p-2"
        >
          <TypographyH2>Tin tức</TypographyH2>
        </Link>
      </Button>

      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
        {news.map((item) => {
          const image = primaryImageUrl(item.images);
          const itemDate = item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "";

          return (
            <Link
              key={item.id}
              href={`/tin-tuc/${item.slug}`}
              className="group flex flex-col gap-3 no-underline"
            >
              {image && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 350px"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                {itemDate && (
                  <span className="text-xs text-muted-foreground/60 font-medium font-sans">
                    {itemDate}
                  </span>
                )}
                <h3 className="font-heading text-base font-semibold tracking-tight text-foreground group-hover:text-foreground/70 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      <Button asChild variant="outline" size="lg">
        <Link href="/tin-tuc">Xem tất cả tin tức</Link>
      </Button>
    </div>
  );
}
