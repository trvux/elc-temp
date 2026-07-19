import type { Metadata } from "next";
import { resolveProductPathFromDb, ResolvedEntity } from "@/modules/catalog/presentation/resolveProductPath";
import { PRODUCT_STATUS, ProductWithRelations } from "@/modules/catalog/domain";
import { ProductDetailModule } from "@/modules/catalog/presentation/components/public/ProductDetailModule";
import { ProductListModule } from "@/modules/catalog/presentation/components/public/ProductListModule";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SITE_NAME = "Điện máy ELC";

function metadataForEntity(entity: ResolvedEntity, slug: string): Metadata {
  const pageUrl = `${BASE_URL}/san-pham/${slug}`;
  const alternates = { canonical: pageUrl };

  if (!entity) return {};

  if (entity.type === "product") {
    const product = entity.data;
    // Archived products 404 (see the page component below) — no metadata
    // to build, the not-found boundary owns the response from here.
    if (product.status === PRODUCT_STATUS.ARCHIVED) return {};

    const title = product.metaTitle || product.name;
    const description = product.metaDescription || product.shortDescription || undefined;
    const image = primaryImageUrl(product.images);
    return {
      title: `${title} | ${SITE_NAME}`,
      description,
      alternates,
      openGraph: {
        title,
        description,
        url: pageUrl,
        images: image ? [{ url: image }] : undefined,
      },
    };
  }

  // group/category/brand — same listing-page metadata shape
  const data = entity.data;
  const title = data.metaTitle || data.name;
  const description = data.metaDescription || undefined;
  const image = entity.type === "brand" ? entity.data.logoUrl : entity.data.imageUrl;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

// Filter/search/sort query params make this a distinct view of the same
// listing — canonicalize back to the clean URL + noindex (still follow, so
// crawl budget isn't wasted on the near-infinite filter-combination space)
// per Google's own faceted-navigation guidance, and the decision already
// locked in elc_new_product_model_decided_2026_07_17.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const hasFilterParams = Object.keys(sp).some(
    (key) => key === "search" || key === "min_price" || key === "max_price" || key === "sort_by" || key.startsWith("attr_"),
  );
  if (hasFilterParams) {
    return {
      robots: { index: false, follow: true },
      alternates: { canonical: `${BASE_URL}/san-pham/${slug}` },
    };
  }

  const resolved = await resolveProductPathFromDb(slug);
  return metadataForEntity(resolved, slug);
}

export default async function FlatSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const resolved = await resolveProductPathFromDb(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "product") {
    const product = resolved.data as ProductWithRelations;
    // Discontinued: keep the URL, don't render it live forever (matches
    // the "unpublish stays 200 forever" bug fixed for production — see
    // Phần A of the SEO audit). No soft-404 redirect to a shared page —
    // 404 stays at this exact URL.
    if (product.status === PRODUCT_STATUS.ARCHIVED) {
      notFound();
    }
    return <ProductDetailModule product={product} />;
  }

  // If group, category, or brand, render ProductListModule
  return <ProductListModule entity={resolved} searchParams={sp} />;
}
