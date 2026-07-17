import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";

interface ProjectsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const params = await searchParams;
  return <ProjectListModule projectType={null} searchParams={params} />;
}
