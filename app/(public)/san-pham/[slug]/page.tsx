import { resolveProductPathFromDb } from "@/modules/catalog/presentation/resolveProductPath";
import { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductDetailModule } from "@/modules/catalog/presentation/components/public/ProductDetailModule";
import { ProductListModule } from "@/modules/catalog/presentation/components/public/ProductListModule";
import {
  generateBrandMetadata,
  generateCategoryMetadata,
  generateProductMetadata,
} from "@/shared/lib/seo-utils";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveProductPathFromDb(slug);

  if (!resolved) return {};

  const baseUrl = BASE_URL.replace(/\/$/, "");
  const previousImages = (await parent).openGraph?.images || [];

  switch (resolved.type) {
    case "product": {
      const product = resolved.data;
      const seoMetadata = generateProductMetadata(product);
      const ogImages = seoMetadata.openGraph?.images;
      const seoImages = Array.isArray(ogImages) ? ogImages : ogImages ? [ogImages] : [];
      return {
        ...seoMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}` },
        openGraph: {
          ...seoMetadata.openGraph,
          images: [...seoImages, ...previousImages],
        },
      } as Metadata;
    }

    case "group":
    case "category": {
      const category = resolved.data;
      const seoMetadata = generateCategoryMetadata(category as unknown as Record<string, unknown>, 0); // Count can be added if needed
      const canonicalUrl = `${baseUrl}/san-pham/${slug}`;

      const ogImages = seoMetadata.openGraph?.images;
      const seoImages = Array.isArray(ogImages) ? ogImages : ogImages ? [ogImages] : [];

      return {
        ...seoMetadata,
        alternates: { canonical: canonicalUrl },
        openGraph: {
          ...seoMetadata.openGraph,
          images: [...seoImages, ...previousImages],
          url: canonicalUrl,
        },
      } as Metadata;
    }

    case "brand": {
      const brandMetadata = generateBrandMetadata(resolved.data as unknown as Record<string, unknown>);
      const canonicalUrl = `${baseUrl}/san-pham/${slug}`;
      return {
        ...brandMetadata,
        alternates: { canonical: canonicalUrl },
      };
    }
  }

  return {};
}

export default async function FlatSlugPage({ params }: Props) {
  const { slug } = await params;

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
  return <ProductListModule entity={resolved} />;
}
