import { HighlightedText } from "@/shared/components/organisms/layout/user/highlighted-text";
import { Badge } from "@/shared/components/ui/badge";
import { buttonVariants } from "@/shared/components/ui/button";
import { ArrowRight, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { ProjectWithCategory } from "../../domain/types";
import { primaryImageUrl } from "@/shared/lib/image-asset";

interface ProjectCardProps {
  project: ProjectWithCategory;
  queryTokens?: string[];
  priority?: boolean;
}

export function ProjectCard({
  project,
  queryTokens = [],
  priority = false,
}: ProjectCardProps) {
  const image = primaryImageUrl(project.images) || "/placeholder.png";
  const projectUrl = `/du-an/${project.slug}`;

  return (
    <Link
      href={projectUrl}
      aria-label={`Xem dự án ${project.title}`}
      className="rounded-2xl bg-muted/30 p-1 flex flex-col border border-border gap-1.5 shadow-xs"
    >
      {/* Card con: ảnh dự án */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-background border border-border">
        <Image
          src={image}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-fill"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
        {project.isFeatured && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            <Sparkle data-icon="inline-start" className="fill-amber-500 text-amber-500" />
            Nổi bật
          </Badge>
        )}
      </div>

      {/* Header: tên dự án (trái) + button truy cập (phải) */}
      <div className="flex items-center justify-between gap-3 px-2 py-1">
        <h3 className="font-heading text-base font-medium leading-tight line-clamp-1 min-w-0">
          <HighlightedText text={project.title} queryTokens={queryTokens} />
        </h3>
        <span
          aria-hidden="true"
          className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "shrink-0" })}
        >
          <ArrowRight weight="bold" />
        </span>
      </div>
    </Link>
  );
}

export default ProjectCard;
