import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/shared/components/ui/button";
import { TypographyH2 } from "@/shared/components/ui/typography";

export interface CategoryBannerData {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  tagline?: string;
}

interface CategoryBannersSectionProps {
  categories: CategoryBannerData[];
}

// Apple-style category entry points: one banner per category (image + name
// + a short tagline), not a grid of individual product cards — this section
// used to render each category's actual product cards (name/price/image per
// SKU), which duplicated /san-pham's real content instead of just pointing
// at it. A banner carries no per-SKU name/price data — the only thing
// duplicated with /san-pham is the category name itself (unavoidable, and
// harmless — a nav label, not a competing content page). Full product
// listing + real commercial copy stays owned entirely by /san-pham/[slug],
// same principle as apple.com/vn: the homepage only teases the category,
// the dedicated page does the selling.
export function CategoryBannersSection({ categories }: CategoryBannersSectionProps) {
  if (categories.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <Button asChild variant="link">
        <Link
          href="/san-pham"
          className="group relative inline-flex items-center justify-center transition-colors p-2"
        >
          <TypographyH2>Sản phẩm</TypographyH2>
        </Link>
      </Button>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/san-pham/${category.slug}`}
            className="group relative flex aspect-4/3 w-full flex-col justify-end overflow-hidden rounded-2xl border border-border no-underline"
          >
            {category.imageUrl && (
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
            />
            <div className="relative z-10 flex flex-col gap-1 p-4 md:p-5">
              <h3 className="font-heading text-lg font-semibold tracking-tight text-white drop-shadow-sm">
                {category.name}
              </h3>
              {category.tagline && (
                <p className="text-sm text-white/80 line-clamp-2 drop-shadow-sm">
                  {category.tagline}
                </p>
              )}
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-white">
                Khám phá
                <ArrowRight weight="bold" className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
