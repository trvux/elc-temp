import type { Metadata } from "next";
import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";
import { BASE_URL } from "@/shared/lib/seo-schema";

export const metadata: Metadata = {
  title: "Dự án đã thi công | Điện máy ELC",
  description:
    "Hơn 60 công trình thi công hệ thống điều hòa không khí, cấp khí tươi thu hồi nhiệt do Điện máy ELC thực hiện — nhà xưởng, văn phòng, chung cư, biệt thự, cơ sở kinh doanh.",
  alternates: { canonical: `${BASE_URL}/du-an` },
};

interface ProjectsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const params = await searchParams;
  return <ProjectListModule projectType={null} searchParams={params} />;
}
