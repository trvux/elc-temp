"use client";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import Image from "next/image";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import Link from "next/link";

export interface CardServiceProps {
  title?: string;
  price?: string;
  image?: string;
  description?: string;
  badges?: string[];
  slug?: string;
  locationSlug?: string;
}

export function CardService({
  title,
  price,
  image,
  description,
  badges,
  slug,
  locationSlug,
}: CardServiceProps) {
  const imageSrc = image || "/placeholder.png";

  const renderImage = () => {
    const imgEl = (
      <Image
        src={imageSrc}
        alt={title || ""}
        fill
        sizes="(max-width: 768px) 100vw, 384px"
        className="relative z-20 object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );

    if (slug) {
      const href = locationSlug ? `/dich-vu/${slug}/${locationSlug}` : `/dich-vu/${slug}`;
      return (
        <Link
          href={href}
          className="block relative z-20 overflow-hidden w-full h-full"
        >
          {imgEl}
        </Link>
      );
    }
    return imgEl;
  };

  const renderTitle = () => {
    if (slug) {
      const href = locationSlug ? `/dich-vu/${slug}/${locationSlug}` : `/dich-vu/${slug}`;
      return (
        <Link
          href={href}
          className="hover:text-primary transition-colors"
        >
          {title}
        </Link>
      );
    }
    return title;
  };

  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden flex flex-col h-full group">
      {/* Thumbnail overlay at top */}
      <div className="relative aspect-video w-full overflow-hidden">
        <div className="absolute inset-0 z-30 bg-black/35 pointer-events-none" />
        {renderImage()}
      </div>

      {/* Info details */}
      <CardHeader className="flex-1 px-4">
        <CardTitle className="text-base sm:text-lg leading-snug">{renderTitle()}</CardTitle>

        {/* Display badges if exists */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {badges.map((badge, idx) => (
              <Badge
                key={idx}
                variant="secondary"
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {description && (
          <CardDescription className="mt-2 line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Footer controls */}
      <CardFooter className="mt-auto flex flex-col gap-2 w-full px-4">
        {/* Price block designed as a secondary button-like element */}
        <div
          className="flex h-9 w-full items-center justify-center rounded-md bg-secondary px-3 text-sm font-semibold text-secondary-foreground truncate"
          title={price}
        >
          {price}
        </div>

        <Button asChild className="w-full">
          <a
            href="https://zalo.me/0789978898"
            target="_blank"
            rel="noopener noreferrer"
          >
            Đặt lịch
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
