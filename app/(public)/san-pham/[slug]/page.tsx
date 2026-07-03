import { resolveProductPath } from "@/modules/catalog/application/resolveProductPath";
import { resolveProductPathFromDb } from "@/modules/catalog/infrastructure/resolveProductPath";
import { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductDetailModule } from "@/modules/catalog/presentation/components/public/ProductDetailModule";
import { ProductListModule } from "@/modules/catalog/presentation/components/public/ProductListModule";
import {
  generateBrandMetadata,
  generateCategoryMetadata,
  generateProductMetadata,
  SHOP_NAME,
} from "@/shared/lib/seo-utils";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

import { getCachedRelatedProducts } from "@/shared/components/layout/user/related-products";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveProductPath(resolveProductPathFromDb, slug);

  if (!resolved) return {};

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn"
  ).replace(/\/$/, "");
  const previousImages = (await parent).openGraph?.images || [];
  const sParams = await searchParams;
  // Page 2+ of a category/brand/group listing is more of the same list, not a
  // distinct landing page — keep it crawlable (real <Link>s) but out of the index,
  // canonicalized to page 1, same reasoning as the [location] pages.
  const isPastFirstPage = Math.floor(Number(sParams.page)) > 1;

  switch (resolved.type) {
    case "product": {
      const product = resolved.data;
      const relatedProducts = await getCachedRelatedProducts(product.categoryId, product.id, product.brandId);
      const seoMetadata = generateProductMetadata(product, undefined, relatedProducts);
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
      const brands =
        typeof sParams.brands === "string"
          ? [sParams.brands]
          : Array.isArray(sParams.brands)
            ? sParams.brands
            : [];

      let seoMetadata = generateCategoryMetadata(category as unknown as Record<string, unknown>, 0); // Count can be added if needed

      const canonicalUrl = `${baseUrl}/san-pham/${slug}`;

      if (brands.length === 1) {
        const brandName = brands[0]; // Normally we'd fetch the exact brand name here, simplified for now
        const title = `Danh sách ${category.name} ${brandName} chính hãng, giá tốt nhất | ${SHOP_NAME}`;
        const description = `Mua ${category.name} ${brandName} chính hãng tại Điện máy ELC. Cam kết chất lượng cao, bảo hành lâu dài, lắp đặt chuyên nghiệp, giá rẻ nhất thị trường.`;

        seoMetadata = {
          ...seoMetadata,
          title,
          description,
          openGraph: {
            ...seoMetadata.openGraph,
            title,
            description,
            images: seoMetadata.openGraph?.images || [],
            url: canonicalUrl,
            type: "website",
          },
        };
      }

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
        ...(isPastFirstPage ? { robots: { index: false, follow: true } } : {}),
      } as Metadata;
    }

    case "brand": {
      const brandMetadata = generateBrandMetadata(resolved.data as unknown as Record<string, unknown>);
      return {
        ...brandMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}` },
        ...(isPastFirstPage ? { robots: { index: false, follow: true } } : {}),
      };
    }
  }

  return {};
}

export default async function FlatSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;

  const resolved = await resolveProductPath(resolveProductPathFromDb, slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "product") {
    return (
      <ProductDetailModule product={resolved.data as ProductWithRelations} />
    );
  }

  // If group, category, or brand, render ProductListModule
  const resolvedSearchParams = await searchParams;
  return (
    <ProductListModule entity={resolved} searchParams={resolvedSearchParams} />
  );
}
