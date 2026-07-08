import React from "react";
import Link from "next/link";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import { News } from "../../domain/types";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Calendar } from "@phosphor-icons/react/dist/ssr";
import { primaryImageUrl } from "@/shared/lib/image-asset";

interface NewsCardProps {
  news: News;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const formattedDate = new Date(news.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card className="overflow-hidden h-full flex flex-col group hover:shadow-lg transition-all duration-300">
      <Link href={`/tin-tuc/${news.slug}`} className="relative aspect-video block overflow-hidden">
        <ImageWithSkeleton
          src={primaryImageUrl(news.images) || "/placeholder.png"}
          alt={news.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          wrapperClassName="w-full h-full"
        />
      </Link>
      <CardContent className="p-4 flex-grow">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>
        <Link href={`/tin-tuc/${news.slug}`}>
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {news.title}
          </h3>
        </Link>
      </CardContent>
    </Card>
  );
};
