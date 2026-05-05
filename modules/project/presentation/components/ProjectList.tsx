import React from "react";
import { ProjectWithCategory } from "../../domain/types";
import { ProjectCard } from "./ProjectCard";

interface ProjectListProps {
  projects: ProjectWithCategory[];
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không tìm thấy dự án nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
