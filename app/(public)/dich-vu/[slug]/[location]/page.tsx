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
import { DISTRICTS } from "@/shared/lib/districts";

interface PageProps {
  params: Promise<{
    slug: string;
    location: string;
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

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, location: locationSlug } = await params;
  const service = await getCachedService(slug);
  const district = DISTRICTS.find((d) => d.slug === locationSlug);

  if (!service || !district) return {};

  return generateServiceMetadata(service as unknown as Record<string, unknown>, district);
}

export default async function ServiceDetailLocationPage({ params }: PageProps) {
  const { slug, location: locationSlug } = await params;
  const service = await getCachedService(slug);
  const district = DISTRICTS.find((d) => d.slug === locationSlug);

  if (!service || !district) {
    notFound();
  }

  const branches = await getBranches(branchRepo, { isPublished: true });
  const serviceSchema = generateServiceDetailSchema(service, branches, undefined, district);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <ServiceDetailModule service={service} location={district} />
    </>
  );
}
