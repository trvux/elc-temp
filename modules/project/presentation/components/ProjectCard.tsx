import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ProjectWithCategory } from "../../domain/types";
import { Card, CardContent } from "@/shared/components/ui/card";

interface ProjectCardProps {
  project: ProjectWithCategory;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Card className="overflow-hidden h-full flex flex-col group hover:shadow-lg transition-all duration-300">
      <Link href={`/du-an/${project.slug}`} className="relative aspect-[4/3] block overflow-hidden">
        <Image
          src={project.images?.[0] || "/placeholder.png"}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>
      <CardContent className="p-4">
        <div className="text-xs text-primary font-medium mb-1 uppercase tracking-wider">
          {project.category?.name || "Dự án"}
        </div>
        <Link href={`/du-an/${project.slug}`}>
          <h3 className="font-bold text-xl line-clamp-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
        </Link>
      </CardContent>
    </Card>
  );
};
