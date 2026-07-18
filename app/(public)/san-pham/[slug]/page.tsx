import type { Metadata } from "next";
import { resolveProductPathFromDb } from "@/modules/catalog/presentation/resolveProductPath";
import { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductDetailModule } from "@/modules/catalog/presentation/components/public/ProductDetailModule";
import { ProductListModule } from "@/modules/catalog/presentation/components/public/ProductListModule";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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
  if (!hasFilterParams) return {};

  return {
    robots: { index: false, follow: true },
    alternates: { canonical: `${BASE_URL}/san-pham/${slug}` },
  };
}

export default async function FlatSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const resolved = await resolveProductPathFromDb(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "product") {
    return (
      <ProductDetailModule product={resolved.data as ProductWithRelations} />
    );
  }

  // If group, category, or brand, render ProductListModule
  return <ProductListModule entity={resolved} searchParams={sp} />;
}
