import type { Metadata } from "next";
// Imported by direct path, NOT from "@/modules/service" — that barrel's
// `export *` also re-exports ServiceManagement (the admin editor,
// TiptapEditor/StarterKit/prosemirror-view and all). Barrel `export *`
// defeats tree-shaking across that many re-export hops, so importing
// ServiceDetailModule through it pulled the whole admin editor into this
// public page's client bundle — confirmed via `next experimental-analyze`
// (2026-09-24): tiptap-shared.ts and its prosemirror-view chain showed up
// as real chunk_parts entries mapped to this route's own client output
// file, not just "listed as available". modules/catalog already avoids
// this (ProductDetailModule is imported by path, never through its
// barrel) — this matches that pattern.
import {
  getServiceBySlugAction,
  getServiceGroupPageAction,
  getServicesAction,
} from "@/modules/service/presentation/actions";
import { getServiceGroupsAction } from "@/modules/service-group/presentation/actions";
import { ServiceGroupModule } from "@/modules/service/presentation/components/public/ServiceGroupModule";
import { ServiceDetailModule } from "@/modules/service/presentation/components/public/ServiceDetailModule";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const [{ data: services }, { data: groups }] = await Promise.all([
    getServicesAction({ isPublished: true }),
    getServiceGroupsAction(),
  ]);
  // Group landing pages (2+ services) live under the same /dich-vu/{slug}
  // namespace as individual services; a service slug wins on any clash.
  const multiGroupSlugs = groups
    .filter((g) => services.filter((s) => s.groupId === g.id).length >= 2)
    .map((g) => g.slug);

  return [...services.map((s) => s.slug), ...multiGroupSlugs]
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
  if (!service) {
    const page = await getServiceGroupPageAction(slug);
    if (!page) return {};
    const { group } = page;
    const title = group.metaTitle || `${group.name} | Điện máy ELC`;
    const description = group.metaDescription || undefined;
    const pageUrl = `${BASE_URL}/dich-vu/${slug}`;
    return {
      title,
      description,
      alternates: { canonical: pageUrl },
      openGraph: { type: "website", title, description, url: pageUrl },
    };
  }

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
    const page = await getServiceGroupPageAction(slug);
    if (!page) notFound();
    return <ServiceGroupModule group={page.group} services={page.services} />;
  }

  return <ServiceDetailModule service={service} />;
}

