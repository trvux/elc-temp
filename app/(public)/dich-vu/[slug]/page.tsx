import {
  getServiceBySlugAction,
  getServicesAction,
  ServiceDetailModule,
} from "@/modules/service";
import { notFound } from "next/navigation";

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

// ─── Main page handler ───────────────────────────────────────────────────────

export default async function ServiceSlugPage({ params }: PageProps) {
  const { slug } = await params;

  const service = await getCachedService(slug);
  if (!service) {
    notFound();
  }

  return <ServiceDetailModule service={service} />;
}

