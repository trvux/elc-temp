import type { Metadata } from "next";
import {
  getServiceBySlugAction,
  getServicesAction,
  ServiceDetailModule,
} from "@/modules/service";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { primaryImageUrl } from "@/shared/lib/image-asset";
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

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getCachedService(slug);
  if (!service) return {};

  const title = service.metaTitle || `${service.title} | Điện máy ELC`;
  const description = service.metaDescription || service.description || undefined;
  const image = primaryImageUrl(service.images);
  const pageUrl = `${BASE_URL}/dich-vu/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      title,
      description,
      url: pageUrl,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
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

