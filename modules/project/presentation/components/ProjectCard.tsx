import { HighlightedText } from "@/shared/components/layout/user/highlighted-text";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
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
  const firstImage = primaryImageUrl(project.images) || "/placeholder.png";

  // Smartly extract the project name/location for a premium short title
  const match =
    project.title.match(/(?:tại|Tại|cho|Cho)\s+(.+)$/) ||
    project.title.match(/-\s+([^-]+)$/);
  const displayTitle =
    match && match[1]
      ? match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1)
      : project.title;

  // If a short title was extracted, show the full details in description. Otherwise, use metaDescription.
  const displayDescription =
    displayTitle !== project.title
      ? project.title
      : project.metaDescription ||
        "Dự án thi công hoàn thiện hệ thống bởi đội ngũ ELC.";

  const projectUrl = `/du-an/${project.slug}`;

  return (
    <Link href={projectUrl} className="w-full block group h-full" prefetch={false}>
      <Card className="relative mx-auto w-full h-full max-w-sm pt-0 overflow-hidden">
        <div className="relative z-20 aspect-video w-full">
          <ImageWithSkeleton
            wrapperClassName="absolute inset-0"
            src={firstImage}
            alt={project.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 z-30" />
        </div>
        <CardHeader className="flex-1">
          {project.isFeatured && (
            <CardAction>
              <Badge variant="secondary">
                <Sparkle
                  data-icon="inline-start"
                  className="fill-amber-500 text-amber-500"
                />
                Nổi bật
              </Badge>
            </CardAction>
          )}

          <CardTitle className="line-clamp-1">
            <HighlightedText text={displayTitle} queryTokens={queryTokens} />
          </CardTitle>
          <CardDescription className="line-clamp-3">
            <HighlightedText
              text={displayDescription}
              queryTokens={queryTokens}
            />
          </CardDescription>
        </CardHeader>
        {/* <CardFooter>
          <Button className="w-full">Đọc bài viết</Button>
        </CardFooter> */}
      </Card>
    </Link>
  );
}

export default ProjectCard;
