import { resolveProductPath } from "@/modules/catalog/application/resolveProductPath";
import { ProductDetailModule } from "@/modules/catalog/presentation/components/public/ProductDetailModule";
import { ProductListModule } from "@/modules/catalog/presentation/components/public/ProductListModule";
import { generateProductMetadata, generateCategoryMetadata, generateBrandMetadata, SHOP_NAME } from "@/shared/lib/seo-utils";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { ProductWithRelations } from "@/modules/catalog/domain";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveProductPath(slug);

  if (!resolved) return {};

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn").replace(/\/$/, "");
  const previousImages = (await parent).openGraph?.images || [];

  switch (resolved.type) {
    case "product": {
      const product = resolved.data;
      const seoMetadata = generateProductMetadata(product);
      return {
        ...seoMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}` },
        openGraph: {
          ...seoMetadata.openGraph,
          images: [...(seoMetadata.openGraph?.images || []), ...previousImages],
        },
      } as Metadata;
    }

    case "group":
    case "category": {
      const category = resolved.data;
      const sParams = await searchParams;
      const brands = typeof sParams.brands === "string" ? [sParams.brands] : Array.isArray(sParams.brands) ? sParams.brands : [];
      
      let seoMetadata = generateCategoryMetadata(category as any, 0); // Count can be added if needed
      
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
            type: seoMetadata.openGraph?.type || "website",
          }
        };
      }

      return {
        ...seoMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}` },
        openGraph: {
          ...seoMetadata.openGraph,
          images: [...(seoMetadata.openGraph?.images || []), ...previousImages],
        }
      } as Metadata;
    }

    case "brand": {
      const brandMetadata = generateBrandMetadata(resolved.data as any);
      return {
        ...brandMetadata,
        alternates: { canonical: `${baseUrl}/san-pham/${slug}` },
      };
    }
  }

  return {};
}

export default async function FlatSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sParams = await searchParams;

  const resolved = await resolveProductPath(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "product") {
    return <ProductDetailModule product={resolved.data as ProductWithRelations} />;
  }

  // If group, category, or brand, use ProductListModule
  return <ProductListModule entity={resolved} searchParams={sParams} />;

}
