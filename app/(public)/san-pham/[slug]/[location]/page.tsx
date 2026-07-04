import { resolveProductPathFromDb } from "@/modules/catalog/presentation/resolveProductPath";
import { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductDetailModule } from "@/modules/catalog/presentation/components/public/ProductDetailModule";
import { ProductListModule } from "@/modules/catalog/presentation/components/public/ProductListModule";
import {
  generateBrandMetadata,
  generateCategoryMetadata,
  generateProductMetadata,
  extractProductHp,
  SHOP_NAME,
} from "@/shared/lib/seo-utils";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { DISTRICTS } from "@/shared/lib/districts";

import { getCachedRelatedProducts } from "@/shared/components/layout/user/related-products";

type Props = {
  params: Promise<{ slug: string; location: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateStaticParams() {
  return [{ slug: "fallback", location: "quan-1" }];
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug, location: locationSlug } = await params;
  const resolved = await resolveProductPathFromDb(slug);
  const district = DISTRICTS.find((d) => d.slug === locationSlug);

  if (!resolved || !district) return {};

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn"
  ).replace(/\/$/, "");
  const previousImages = (await parent).openGraph?.images || [];

  switch (resolved.type) {
    case "product": {
      const product = resolved.data;
      const currentHp = extractProductHp(product);
      const relatedProducts = await getCachedRelatedProducts(product.categoryId, product.id, product.brandId, currentHp);
      const seoMetadata = generateProductMetadata(product, district, relatedProducts);
      const ogImages = seoMetadata.openGraph?.images;
      const seoImages = Array.isArray(ogImages) ? ogImages : ogImages ? [ogImages] : [];
      return {
        ...seoMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}/${locationSlug}` },
        openGraph: {
          ...seoMetadata.openGraph,
          images: [...seoImages, ...previousImages],
        },
      } as Metadata;
    }

    case "group":
    case "category": {
      const category = resolved.data;
      const sParams = await searchParams;
      const brands =
        typeof sParams.brands === "string"
          ? [sParams.brands]
          : Array.isArray(sParams.brands)
            ? sParams.brands
            : [];

      let seoMetadata = generateCategoryMetadata(category as unknown as Record<string, unknown>, 0, district);

      const canonicalUrl = `${baseUrl}/san-pham/${slug}/${locationSlug}`;

      if (brands.length === 1) {
        const brandName = brands[0];
        const title = `Danh sách ${category.name} ${brandName} chính hãng tại ${district.name}, giá tốt nhất | ${SHOP_NAME}`;
        const description = `Mua ${category.name} ${brandName} chính hãng tại Điện máy ELC khu vực ${district.name}. Cam kết chất lượng cao, bảo hành lâu dài, lắp đặt chuyên nghiệp, giá rẻ nhất thị trường.`;

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
      } as Metadata;
    }

    case "brand": {
      const brandMetadata = generateBrandMetadata(resolved.data as unknown as Record<string, unknown>, undefined, district);
      return {
        ...brandMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}/${locationSlug}` },
      };
    }
  }

  return {};
}

export default async function FlatSlugLocationPage({ params, searchParams }: Props) {
  const { slug, location: locationSlug } = await params;
  const district = DISTRICTS.find((d) => d.slug === locationSlug);

  if (!district) {
    notFound();
  }

  const resolved = await resolveProductPathFromDb(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "product") {
    return (
      <ProductDetailModule product={resolved.data as ProductWithRelations} location={district} />
    );
  }

  const resolvedSearchParams = await searchParams;
  return (
    <ProductListModule entity={resolved} searchParams={resolvedSearchParams} location={district} />
  );
}
