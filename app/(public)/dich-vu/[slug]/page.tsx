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
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getReviewSummaryAction } from "@/modules/review";
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
  "use cache";
  cacheLife("days");
  cacheTag("services-list", `service-slug:${slug}`);
  // null = khong tim thay (404 that su). Loi mang/Go API se throw va giu
  // nguyen ban cache cu thay vi bi hieu nham la "khong ton tai".
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
  const { data: reviewSummary } = await getReviewSummaryAction({ serviceId: service.id });
  const serviceSchema = generateServiceDetailSchema(service, branches, undefined, reviewSummary);

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

