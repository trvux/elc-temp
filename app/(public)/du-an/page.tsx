import { ProjectListModule } from "@/modules/project/presentation/components/public/ProjectListModule";
import { getFeaturedProjectsAction, getProjectsAction } from "@/modules/project/presentation/actions";
import type { Metadata } from "next";
import { getCachedSystemPage } from "@/shared/lib/cached-system-page";
import { generateSystemPageMetadata } from "@/shared/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const defaultMeta: Metadata = {
    title: "Dự án Thi công lắp đặt máy lạnh & hệ thống HVAC | Điện máy ELC",
    description: "Tổng hợp các dự án, công trình thi công lắp đặt máy lạnh, hệ thống điều hòa không khí trung tâm VRV/VRF và HVAC tiêu biểu do Điện máy ELC thực hiện toàn quốc.",
    alternates: { canonical: "https://dienmayelc.com.vn/du-an" },
  };

  try {
    let firstProject = (await getFeaturedProjectsAction(1)).data[0];

    if (!firstProject || !firstProject.images || firstProject.images.length === 0) {
      firstProject = (await getProjectsAction({ isPublished: true, limit: 1 })).data[0];
    }

    const ogImage = firstProject?.images?.[0] || "/images/hero-bg.jpg";

    const systemPage = await getCachedSystemPage("du-an");
    const meta = generateSystemPageMetadata(
      systemPage,
      "Dự án Thi công lắp đặt máy lạnh & hệ thống HVAC | Điện máy ELC",
      "Tổng hợp các dự án, công trình thi công lắp đặt máy lạnh, hệ thống điều hòa không khí trung tâm VRV/VRF và HVAC tiêu biểu do Điện máy ELC thực hiện toàn quốc.",
      "/du-an"
    );

    if (meta.openGraph) {
      meta.openGraph.images = [{ url: ogImage }];
    }

    return {
      ...meta,
      alternates: { canonical: "https://dienmayelc.com.vn/du-an" },
    } as Metadata;
  } catch {
    return defaultMeta;
  }
}

interface ProjectsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const params = await searchParams;
  return <ProjectListModule projectType={null} searchParams={params} />;
}
