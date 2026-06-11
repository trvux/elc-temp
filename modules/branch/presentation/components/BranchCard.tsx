import { Branch } from "@/modules/branch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { ArrowRight, Buildings, Envelope, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface BranchCardProps {
  branch: Branch;
  priority?: boolean;
}

export const BranchCard: React.FC<BranchCardProps> = ({ branch, priority = false }) => {
  return (
    <Card className="relative cursor-pointer overflow-hidden hover:shadow-md transition-shadow flex flex-col border-none bg-background/50 backdrop-blur-sm shadow-sm group/card h-full pt-0">
      {branch.imageUrl ? (
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-muted border-b border-border/10">
          <Image
            src={branch.imageUrl}
            alt={branch.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
          />
        </div>
      ) : (
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-b border-border/10 flex items-center justify-center group-hover/card:bg-primary/10 transition-colors duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
          <Buildings className="w-12 h-12 text-primary/40 group-hover/card:scale-110 group-hover/card:text-primary/60 transition-all duration-500" />
        </div>
      )}

      {/* Absolute link overlay to make the whole card clickable */}
      <Link
        href={`/co-so-ha-tang/${branch.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`Chi tiết cơ sở hạ tầng ${branch.name}`}
      />

      <CardHeader className="relative z-10 pb-0">
        <Link
          href={`/co-so-ha-tang/${branch.slug}`}
          className="hover:text-primary transition-colors group relative z-10"
        >
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            {branch.name}
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all group-hover/card:opacity-100 group-hover/card:translate-x-0" />
          </CardTitle>
        </Link>
      </CardHeader>

      <CardContent className="relative z-10 flex-1 py-4">
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <span>{branch.address}</span>
          </div>
          <div className="flex gap-3">
            <Phone className="w-5 h-5 text-primary shrink-0" />
            <a
              href={`tel:${branch.phone}`}
              className="hover:text-primary transition-colors"
            >
              {branch.phone}
            </a>
          </div>
          <div className="flex gap-3">
            <Envelope className="w-5 h-5 text-primary shrink-0" />
            <a
              href={`mailto:${branch.email}`}
              className="hover:text-primary transition-colors"
            >
              {branch.email}
            </a>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative z-10 grid grid-cols-2 gap-3 mt-auto pb-6">
        <Link
          href={`/co-so-ha-tang/${branch.slug}`}
          className={cn(
            "flex items-center justify-center gap-2 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors text-sm font-medium",
            !branch.mapsUrl && "col-span-2",
          )}
        >
          Xem chi tiết
        </Link>
        {branch.mapsUrl && (
          <a
            href={branch.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium shadow-sm"
          >
            Bản đồ
          </a>
        )}
      </CardFooter>
    </Card>
  );
};
