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
import { Sparkle } from "lucide-react";
import Link from "next/link";
import { ProjectWithCategory } from "../../domain/types";

interface ProjectCardProps {
  project: ProjectWithCategory;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const firstImage = project.images?.[0] || "/placeholder.png";

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

  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0">
      <div className="absolute inset-0 z-30 aspect-video " />
      <img
        src={firstImage}
        alt={project.title}
        className="relative z-20 aspect-video w-full object-cover "
      />
      <CardHeader>
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

        <CardTitle className="line-clamp-1">{displayTitle}</CardTitle>
        <CardDescription className="line-clamp-3 h-[60px]">
          {displayDescription}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full bg-foreground" asChild>
          <Link href={`/du-an/${project.slug}`}>Đọc bài viết</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProjectCard;
