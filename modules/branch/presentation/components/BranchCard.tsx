import { Branch } from "@/modules/branch";
import { Buildings } from "@phosphor-icons/react/dist/ssr";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import { TypographyH3 } from "@/shared/components/ui/typography";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import Link from "next/link";
import React from "react";

interface BranchCardProps {
  branch: Branch;
  priority?: boolean;
}

export const BranchCard: React.FC<BranchCardProps> = ({ branch, priority = false }) => {
  const cleanPhone = branch.phone ? branch.phone.replace(/\s/g, "") : "";
  const zaloUrl = cleanPhone ? `https://zalo.me/${cleanPhone}` : "";
  const imageUrl = primaryImageUrl(branch.images);

  return (
    <div id={branch.slug} className="group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-8 border-b border-border/60 last:border-b-0 w-full rounded-md transition-colors duration-500">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 md:gap-2">
        <Link href={`/thong-tin/${branch.slug}`} className="no-underline">
          <TypographyH3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-foreground/60 transition-colors line-clamp-2 leading-snug font-heading">
            {branch.name}
          </TypographyH3>
        </Link>

        <div className="flex flex-col gap-1 md:gap-1.5 mt-1 text-xs sm:text-sm md:text-base text-muted-foreground">
          {branch.address && (
            <div>
              <span className="font-semibold text-foreground/80">Địa chỉ:</span>{" "}
              <span>{branch.address}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-x-4">
            {branch.phone && (
              <div>
                <span className="font-semibold text-foreground/80">Điện thoại:</span>{" "}
                <a
                  href={`tel:${cleanPhone}`}
                  className="hover:text-foreground transition-colors"
                >
                  {branch.phone}
                </a>
              </div>
            )}

            {cleanPhone && (
              <div>
                <span className="font-semibold text-foreground/80">Zalo:</span>{" "}
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {branch.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {imageUrl ? (
        <Link
          href={`/thong-tin/${branch.slug}`}
          className="shrink-0 relative w-36 aspect-video sm:w-48 md:w-64 rounded-lg overflow-hidden"
        >
          <ImageWithSkeleton
            wrapperClassName="w-full h-full"
            src={imageUrl}
            alt={branch.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 144px, (max-width: 768px) 192px, 256px"
            priority={priority}
          />
        </Link>
      ) : (
        <Link
          href={`/thong-tin/${branch.slug}`}
          className="shrink-0 relative w-36 aspect-video sm:w-48 md:w-64 rounded-lg overflow-hidden border bg-gradient-to-br from-primary/5 via-primary/10 to-transparent flex items-center justify-center"
        >
          <Buildings className="w-12 h-12 text-primary/40" />
        </Link>
      )}
    </div>
  );
};
