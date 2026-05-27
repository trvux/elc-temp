import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";

export const metadata = {
  title: "Dự án tiêu biểu | Điện máy ELC",
  description:
    "Tổng hợp các công trình tiêu biểu, biệt thự sang trọng, tòa nhà văn phòng, căn hộ cao cấp do ELC tư vấn thiết kế và trực tiếp thi công lắp đặt.",
};

interface ProjectsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <ProjectListModule serviceType={null} searchParams={resolvedSearchParams} />
  );
}
