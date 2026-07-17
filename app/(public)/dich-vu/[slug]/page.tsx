import {
  getServiceBySlugAction,
  getServicesAction,
  ServiceDetailModule,
} from "@/modules/service";
import {
  generateServiceMetadata,
  generateServiceDetailSchema,
} from "@/shared/lib/seo-utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { unwrapActionResult } from "@/shared/lib/action-result";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { data: services } = await getServicesAction({ isPublished: true });

  return services
    .map((s) => s.slug)
    .filter(Boolean)
    .map((slug) => ({ slug: slug as string }));
}

// ─── Cached fetchers ────────────────────────────────────────────────────────

async function getCachedService(slug: string) {
  return getServiceBySlugAction(slug);
}

// ─── generateMetadata ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getCachedService(slug);
  return generateServiceMetadata(service as unknown as Record<string, unknown>);
}

// ─── Main page handler ───────────────────────────────────────────────────────

export default async function ServiceSlugPage({ params }: PageProps) {
  const { slug } = await params;

  const service = await getCachedService(slug);
  if (!service) {
    notFound();
  }

  const branches = await getBranchesAction({ isPublished: true }).then(unwrapActionResult);
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

