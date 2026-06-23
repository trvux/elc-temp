import { getServiceBySlug } from "@/modules/service/application";
import { serviceRepo } from "@/modules/service/infrastructure/serviceRepo";
import { ServiceDetailModule } from "@/modules/service";
import { generateServiceMetadata, generateServiceDetailSchema } from "@/shared/lib/seo-utils";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { getBranches } from "@/modules/branch/application";
import { branchRepo } from "@/modules/branch/infrastructure/branchRepo";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Cached service fetcher to share with generateMetadata
async function getCachedService(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag("services-list", `service-slug:${slug}`);
  setUseStaticClient(true);

  return getServiceBySlug(serviceRepo, slug);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getCachedService(slug);
  return generateServiceMetadata(service as unknown as Record<string, unknown>);
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getCachedService(slug);

  if (!service) {
    notFound();
  }

  const branches = await getBranches(branchRepo, { isPublished: true });
  const serviceSchema = generateServiceDetailSchema(service, branches);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <ServiceDetailModule service={service} />
    </>
  );
}
